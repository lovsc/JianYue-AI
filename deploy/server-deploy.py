#!/usr/bin/python3
"""Root-owned deploy entrypoint. SSH callers can supply only an archive and hashes."""
import hashlib
import json
import os
import pathlib
import re
import shutil
import signal
import socket
import subprocess
import sys
import tarfile
import time
import urllib.request
import uuid

MAX_ARCHIVE = 64 * 1024 * 1024
MAX_EXPANDED = 256 * 1024 * 1024


class Paths:
    def __init__(self, base=None):
        base = pathlib.Path(base) if base else pathlib.Path('/')
        self.current = base / 'www/wwwroot/jianyue'
        self.releases = base / 'www/jianyue-releases'
        self.data = base / 'www/jianyue-data'
        self.backups = base / 'www/backup/jianyue-ci'
        self.database = self.data / 'resume.db'
        self.environment = self.data / 'production.env'
        self.maintenance = self.data / '.deploying'
        self.node = base / 'opt/jianyue-runtime/node-v22.23.3-linux-x64/bin/node'


def validate_request(commit, digest):
    if not re.fullmatch(r'[a-f0-9]{40}', commit) or not re.fullmatch(r'[a-f0-9]{64}', digest):
        raise ValueError('Expected a full commit SHA and SHA-256 digest')


def receive_archive(stream, target, digest):
    calculated = hashlib.sha256()
    total = 0
    with target.open('xb') as output:
        os.chmod(str(target), 0o600)
        while True:
            chunk = stream.read(65536)
            if not chunk:
                break
            total += len(chunk)
            if total > MAX_ARCHIVE:
                raise ValueError('Release archive exceeds 64 MiB')
            calculated.update(chunk)
            output.write(chunk)
    if total == 0 or calculated.hexdigest() != digest:
        raise ValueError('Release archive checksum mismatch')


def unpack_archive(archive, destination, commit):
    with tarfile.open(str(archive), 'r:gz') as bundle:
        members = bundle.getmembers()
        if len(members) > 5000 or sum(m.size for m in members) > MAX_EXPANDED:
            raise ValueError('Release contains too many or oversized files')
        for member in members:
            parts = pathlib.PurePosixPath(member.name).parts
            if not parts or parts[0] != 'jianyue' or '..' in parts or not (member.isdir() or member.isfile()):
                raise ValueError('Unsafe release member')
            if any(part in {'.env', 'node_modules', '.git'} for part in parts) or any(part.endswith(('.db', '.sqlite', '.sqlite3')) for part in parts):
                raise ValueError('Release may not contain credentials, dependencies or databases')
            # Ignore archive permissions/ownership; do not accept executable privilege bits.
            member.uid = member.gid = 0
            member.uname = member.gname = ''
            member.mode = 0o755 if member.isdir() else 0o644
        bundle.extractall(str(destination), members=members)
    root = destination / 'jianyue'
    manifest = json.loads((root / 'release.json').read_text())
    if manifest.get('format') != 1 or manifest.get('commitSha') != commit:
        raise ValueError('Release manifest does not match the requested commit')
    for required in ['backend/server.js', 'backend/package.json', 'backend/package-lock.json', 'frontend/dist/index.html']:
        if not (root / required).is_file():
            raise ValueError('Release is missing a required application file')
    return root


def atomic_link(target, link):
    temporary = link.with_name(link.name + '.next-' + uuid.uuid4().hex)
    os.symlink(str(target), str(temporary))
    try:
        os.replace(str(temporary), str(link))
    finally:
        if temporary.is_symlink():
            temporary.unlink()


def own_tree(root, user):
    for directory, folders, files in os.walk(str(root)):
        shutil.chown(directory, user=user, group=user)
        for name in files:
            item = os.path.join(directory, name)
            if not os.path.islink(item):
                shutil.chown(item, user=user, group=user)


class Runtime:
    def __init__(self, paths):
        self.paths = paths

    def service(self, action):
        subprocess.run(['systemctl', action, 'jianyue-ai'], check=True)

    def snapshot(self, destination):
        # Run the native module as the app user, never as root.
        temporary = self.paths.data / ('snapshot-' + uuid.uuid4().hex + '.db')
        code = ('const Database=require(process.argv[1]);const db=new Database(process.argv[2],{readonly:true});'
                'db.backup(process.argv[3]).then(()=>db.close()).catch(()=>{db.close();process.exitCode=1});')
        module = self.paths.current / 'backend/node_modules/better-sqlite3'
        subprocess.run(['/usr/sbin/runuser', '-u', 'www', '--', str(self.paths.node), '-e', code, str(module), str(self.paths.database), str(temporary)], check=True)
        try:
            shutil.copy2(str(temporary), str(destination))
            os.chmod(str(destination), 0o600)
        finally:
            if temporary.exists():
                temporary.unlink()

    def install(self, release):
        own_tree(release, 'www')
        environment = dict(os.environ)
        environment['PATH'] = str(self.paths.node.parent) + ':/usr/local/bin:/usr/bin:/bin'
        cache = self.paths.data / 'npm-cache'
        cache.mkdir(exist_ok=True, mode=0o700)
        shutil.chown(str(cache), user='www', group='www')
        environment['npm_config_cache'] = str(cache)
        npm_cli = self.paths.node.parent.parent / 'lib/node_modules/npm/bin/npm-cli.js'
        subprocess.run(['/usr/sbin/runuser', '-u', 'www', '--', str(self.paths.node), str(npm_cli), 'ci', '--omit=dev', '--no-audit', '--no-fund'], cwd=str(release / 'backend'), env=environment, check=True, timeout=600)
        own_tree(release, 'root')
        os.symlink(str(self.paths.environment), str(release / 'backend/.env'))

    def preflight(self, release, snapshot, commit):
        sandbox = self.paths.data / ('preflight-' + uuid.uuid4().hex)
        sandbox.mkdir(mode=0o700)
        shutil.copy2(str(snapshot), str(sandbox / 'resume.db'))
        own_tree(sandbox, 'www')
        listener = socket.socket()
        listener.bind(('127.0.0.1', 0))
        port = listener.getsockname()[1]
        listener.close()
        env = dict(os.environ, NODE_ENV='production', HOST='127.0.0.1', PORT=str(port), DATABASE_PATH=str(sandbox / 'resume.db'))
        log_path = sandbox / 'startup.log'
        try:
            with log_path.open('w') as log:
                process = subprocess.Popen(['/usr/sbin/runuser', '-u', 'www', '--', str(self.paths.node), str(release / 'backend/server.js')], cwd=str(release / 'backend'), env=env, stdout=log, stderr=log, start_new_session=True)
                try:
                    self.health(commit, 'http://127.0.0.1:' + str(port), attempts=30)
                    if process.poll() is not None:
                        raise RuntimeError('Candidate process exited unexpectedly')
                finally:
                    if process.poll() is None:
                        os.killpg(process.pid, signal.SIGTERM)
                        try:
                            process.wait(timeout=10)
                        except subprocess.TimeoutExpired:
                            os.killpg(process.pid, signal.SIGKILL)
                            process.wait()
        finally:
            # Only this freshly generated directory is removed; live data is outside it.
            if sandbox.parent == self.paths.data and sandbox.name.startswith('preflight-'):
                shutil.rmtree(str(sandbox))

    def health(self, commit, origin='http://127.0.0.1:3000', attempts=30):
        for attempt in range(attempts):
            try:
                with urllib.request.urlopen(origin + '/api/v1/health', timeout=3) as response:
                    value = json.load(response)
                if value.get('success') and (commit is None or value.get('data', {}).get('releaseSha') == commit):
                    with urllib.request.urlopen(origin + '/', timeout=3) as response:
                        if b'<div id="app">' in response.read():
                            return
            except Exception:
                pass
            time.sleep(1)
        raise RuntimeError('Application health or release version check failed')


def deploy_candidate(paths, runtime, release, commit, backup):
    if not paths.current.is_symlink():
        raise RuntimeError('Run the one-time CI installer before deploying')
    previous = paths.current.resolve()
    runtime.snapshot(backup / 'preflight.db')
    runtime.preflight(release, backup / 'preflight.db', commit)
    paths.maintenance.write_text(commit + '\n')
    stopped = False
    switched = False
    snapshot_ready = False
    writes_safe = False
    try:
        runtime.service('stop')
        stopped = True
        runtime.snapshot(backup / 'resume.db')
        snapshot_ready = True
        atomic_link(release, paths.current)
        switched = True
        runtime.service('start')
        runtime.health(commit)
        runtime.health(commit, 'https://octopush5.com', attempts=10)
        (backup / 'deployment.json').write_text(json.dumps({'commit': commit, 'previous': str(previous), 'release': str(release), 'status': 'success'}))
        writes_safe = True
        print('Deployment passed: ' + commit, flush=True)
    except Exception:
        if switched:
            runtime.service('stop')
            atomic_link(previous, paths.current)
            if snapshot_ready:
                # Writes were blocked during verification; restore before restarting old code.
                for suffix in ['', '-wal', '-shm']:
                    failed = pathlib.Path(str(paths.database) + suffix)
                    if failed.exists():
                        shutil.copy2(str(failed), str(backup / ('failed-resume.db' + suffix)))
                replacement = paths.data / ('restore-' + uuid.uuid4().hex + '.db')
                shutil.copy2(str(backup / 'resume.db'), str(replacement))
                shutil.chown(str(replacement), user='www', group='www')
                os.chmod(str(replacement), 0o600)
                os.replace(str(replacement), str(paths.database))
                for suffix in ['-wal', '-shm']:
                    journal = pathlib.Path(str(paths.database) + suffix)
                    if journal.exists():
                        journal.unlink()
        if stopped:
            runtime.service('start')
            runtime.health(None)
        writes_safe = True
        print('Deployment failed; previous application restored. Review deployment logs.', flush=True)
        raise
    finally:
        if (writes_safe or not stopped) and paths.maintenance.exists():
            paths.maintenance.unlink()


def main():
    if os.geteuid() != 0 or len(sys.argv) != 3:
        raise RuntimeError('Root deploy entrypoint expects exactly two arguments')
    commit, digest = sys.argv[1:]
    validate_request(commit, digest)
    paths = Paths()
    paths.releases.mkdir(parents=True, exist_ok=True)
    paths.backups.mkdir(parents=True, exist_ok=True, mode=0o700)
    import fcntl
    with (paths.releases / '.deploy.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        task = paths.releases / ('incoming-' + uuid.uuid4().hex)
        task.mkdir(mode=0o700)
        backup = paths.backups / (time.strftime('%Y%m%d-%H%M%S-') + commit[:12])
        backup.mkdir(mode=0o700)
        try:
            archive = task / 'release.tar.gz'
            receive_archive(sys.stdin.buffer, archive, digest)
            candidate = unpack_archive(archive, task, commit)
            # A new attempt gets a unique directory even when redeploying the same commit.
            release = paths.releases / (commit + '-' + uuid.uuid4().hex[:8])
            os.rename(str(candidate), str(release))
            os.chmod(str(release), 0o755)
            runtime = Runtime(paths)
            runtime.install(release)
            deploy_candidate(paths, runtime, release, commit, backup)
        finally:
            if task.parent == paths.releases and task.name.startswith('incoming-'):
                shutil.rmtree(str(task))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('Deploy error: ' + str(error), file=sys.stderr)
        sys.exit(1)
