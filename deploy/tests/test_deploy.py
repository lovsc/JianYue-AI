import hashlib
import importlib.util
import io
import json
import os
import pathlib
import shutil
import tarfile
import tempfile
import unittest
from unittest import mock

SOURCE = pathlib.Path(__file__).resolve().parents[1] / 'server-deploy.py'
spec = importlib.util.spec_from_file_location('jianyue_deploy', str(SOURCE))
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)
COMMIT = 'a' * 40


def archive_bytes(extra=None, manifest_commit=COMMIT):
    entries = {
        'jianyue/release.json': json.dumps({'format': 1, 'commitSha': manifest_commit}).encode(),
        'jianyue/backend/server.js': b'fixture',
        'jianyue/backend/package.json': b'{}',
        'jianyue/backend/package-lock.json': b'{}',
        'jianyue/frontend/dist/index.html': b'<div id="app"></div>',
    }
    result = io.BytesIO()
    with tarfile.open(fileobj=result, mode='w:gz') as bundle:
        for name, value in entries.items():
            entry = tarfile.TarInfo(name)
            entry.size = len(value)
            bundle.addfile(entry, io.BytesIO(value))
        if extra:
            bundle.addfile(extra)
    return result.getvalue()


class ArchiveTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def test_archive_checksum_and_metadata(self):
        payload = archive_bytes()
        target = self.root / 'release.tar.gz'
        deploy.receive_archive(io.BytesIO(payload), target, hashlib.sha256(payload).hexdigest())
        root = deploy.unpack_archive(target, self.root / 'extracted', COMMIT)
        self.assertTrue((root / 'frontend/dist/index.html').is_file())

    def test_reject_wrong_hash_and_oversized_stream(self):
        with self.assertRaisesRegex(ValueError, 'checksum'):
            deploy.receive_archive(io.BytesIO(b'wrong'), self.root / 'wrong', 'b' * 64)
        with mock.patch.object(deploy, 'MAX_ARCHIVE', 8):
            with self.assertRaisesRegex(ValueError, '64 MiB'):
                deploy.receive_archive(io.BytesIO(b'x' * 9), self.root / 'oversized', 'b' * 64)

    def test_reject_path_traversal_and_link(self):
        for name, kind in [('jianyue/../../escape', tarfile.REGTYPE), ('jianyue/backend/.env', tarfile.SYMTYPE)]:
            extra = tarfile.TarInfo(name)
            extra.type = kind
            extra.linkname = '/etc/passwd'
            archive = self.root / ('archive-' + str(kind) + '.tar.gz')
            archive.write_bytes(archive_bytes(extra))
            with self.assertRaises(ValueError):
                deploy.unpack_archive(archive, self.root / 'rejected', COMMIT)
        self.assertFalse((self.root / 'escape').exists())

    def test_reject_secrets_and_database_files(self):
        for index, name in enumerate(['jianyue/backend/.env', 'jianyue/backend/database.db', 'jianyue/backend/node_modules/package.json']):
            archive = self.root / ('secret-' + str(index) + '.tar.gz')
            archive.write_bytes(archive_bytes(tarfile.TarInfo(name)))
            with self.assertRaisesRegex(ValueError, 'credentials'):
                deploy.unpack_archive(archive, self.root / 'secret-output', COMMIT)

    def test_reject_wrong_commit_and_command_injection(self):
        archive = self.root / 'mismatch.tar.gz'
        archive.write_bytes(archive_bytes(manifest_commit='b' * 40))
        with self.assertRaisesRegex(ValueError, 'manifest'):
            deploy.unpack_archive(archive, self.root / 'mismatch', COMMIT)
        for commit in ['main', COMMIT + ';id', '-help', 'a' * 39]:
            with self.assertRaises(ValueError):
                deploy.validate_request(commit, 'b' * 64)


class FakeRuntime:
    def __init__(self, paths, preflight_failure=False, health_failure=False):
        self.paths = paths
        self.preflight_failure = preflight_failure
        self.health_failure = health_failure
        self.events = []

    def snapshot(self, target):
        shutil.copy2(str(self.paths.database), str(target))

    def preflight(self, *args):
        self.events.append('preflight')
        if self.preflight_failure:
            raise RuntimeError('candidate failed')

    def service(self, action):
        self.events.append(action)

    def health(self, commit, *args, **kwargs):
        self.events.append('health')
        if commit and self.health_failure:
            # Simulate a startup schema migration before the new release fails.
            self.paths.database.write_text('failed-new-schema')
            raise RuntimeError('new service failed')


@unittest.skipUnless(os.name == 'posix', 'Real symlink transitions run in Linux CI')
class TransitionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.paths = deploy.Paths(self.temp.name)
        self.paths.releases.mkdir(parents=True)
        self.paths.data.mkdir(parents=True)
        self.paths.backups.mkdir(parents=True)
        self.paths.current.parent.mkdir(parents=True)
        self.previous = self.paths.releases / 'old'
        self.previous.mkdir()
        self.release = self.paths.releases / COMMIT
        self.release.mkdir()
        self.paths.current.symlink_to(self.previous)
        self.paths.environment.write_text('do-not-change-the-production-secret')
        self.paths.database.write_text('original-user-data')

    def tearDown(self):
        self.temp.cleanup()

    def test_success_preserves_environment_and_database(self):
        runtime = FakeRuntime(self.paths)
        deploy.deploy_candidate(self.paths, runtime, self.release, COMMIT, self.paths.backups)
        self.assertEqual(self.paths.current.resolve(), self.release)
        self.assertEqual(self.paths.database.read_text(), 'original-user-data')
        self.assertEqual(self.paths.environment.read_text(), 'do-not-change-the-production-secret')
        self.assertFalse(self.paths.maintenance.exists())
        self.assertEqual(runtime.events, ['preflight', 'stop', 'start', 'health', 'health'])

    def test_preflight_failure_never_stops_live_service(self):
        runtime = FakeRuntime(self.paths, preflight_failure=True)
        with self.assertRaises(RuntimeError):
            deploy.deploy_candidate(self.paths, runtime, self.release, COMMIT, self.paths.backups)
        self.assertEqual(self.paths.current.resolve(), self.previous)
        self.assertEqual(runtime.events, ['preflight'])
        self.assertFalse(self.paths.maintenance.exists())

    def test_failed_release_restores_previous_code_and_user_data(self):
        runtime = FakeRuntime(self.paths, health_failure=True)
        with mock.patch.object(deploy.shutil, 'chown'):
            with self.assertRaisesRegex(RuntimeError, 'new service failed'):
                deploy.deploy_candidate(self.paths, runtime, self.release, COMMIT, self.paths.backups)
        self.assertEqual(self.paths.current.resolve(), self.previous)
        self.assertEqual(self.paths.database.read_text(), 'original-user-data')
        self.assertEqual((self.paths.backups / 'failed-resume.db').read_text(), 'failed-new-schema')
        self.assertFalse(self.paths.maintenance.exists())
        self.assertEqual(runtime.events[-2:], ['start', 'health'])

    def test_failed_recovery_keeps_writes_blocked(self):
        runtime = FakeRuntime(self.paths, health_failure=True)
        def unhealthy(*args, **kwargs):
            raise RuntimeError('health unavailable')
        runtime.health = unhealthy
        with mock.patch.object(deploy.shutil, 'chown'):
            with self.assertRaises(RuntimeError):
                deploy.deploy_candidate(self.paths, runtime, self.release, COMMIT, self.paths.backups)
        self.assertTrue(self.paths.maintenance.exists())


if __name__ == '__main__':
    unittest.main()
