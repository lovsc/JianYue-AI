#!/usr/bin/python3
"""One-time installer run by the server owner, not by GitHub Actions."""
import os
import pathlib
import pwd
import re
import shutil
import subprocess
import sys


def install(source, destination, mode=0o755):
    shutil.copy2(str(source), str(destination))
    os.chown(str(destination), 0, 0)
    os.chmod(str(destination), mode)


def main():
    if os.geteuid() != 0 or len(sys.argv) != 2:
        raise RuntimeError('Run as root with the deployment PUBLIC key file as the only argument')
    public = pathlib.Path(sys.argv[1]).read_text().strip()
    if not re.fullmatch(r'ssh-ed25519 [A-Za-z0-9+/=]+(?: [A-Za-z0-9._-]+)?', public):
        raise ValueError('Expected one Ed25519 public key; no private key is needed on the server')
    current = pathlib.Path('/www/wwwroot/jianyue')
    data = pathlib.Path('/www/jianyue-data')
    releases = pathlib.Path('/www/jianyue-releases')
    if not (current / 'backend/.env').is_file() or not (data / 'resume.db').is_file():
        raise RuntimeError('The existing application and database must be present')
    if not pathlib.Path('/opt/jianyue-runtime/node-v22.23.3-linux-x64/bin/node').is_file():
        raise RuntimeError('Expected deployed Node runtime is missing')
    releases.mkdir(mode=0o755, parents=True, exist_ok=True)
    environment = data / 'production.env'
    if not environment.exists():
        shutil.copy2(str(current / 'backend/.env'), str(environment))
        shutil.chown(str(environment), user='www', group='www')
        os.chmod(str(environment), 0o600)
    if not current.is_symlink():
        bootstrap = releases / 'bootstrap-20261017'
        if bootstrap.exists():
            raise RuntimeError('Bootstrap directory exists; migration requires review')
        os.rename(str(current), str(bootstrap))
        try:
            os.symlink(str(bootstrap), str(current))
        except Exception:
            os.rename(str(bootstrap), str(current))
            raise
    resolved = current.resolve()
    if resolved.parent != releases:
        raise RuntimeError('Current application points outside the releases directory')
    old_env = resolved / 'backend/.env'
    if not old_env.is_symlink():
        # Keep the initial private file as part of the preserved bootstrap release.
        backup_env = old_env.with_name('.env.before-ci')
        if backup_env.exists():
            raise RuntimeError('Environment backup already exists; stopping')
        os.rename(str(old_env), str(backup_env))
        os.symlink(str(environment), str(old_env))
    source = pathlib.Path(__file__).resolve().parent
    libexec = pathlib.Path('/usr/local/libexec')
    libexec.mkdir(parents=True, exist_ok=True)
    install(source / 'server-deploy.py', libexec / 'jianyue-deploy.py')
    install(source / 'ci-gateway.py', pathlib.Path('/usr/local/sbin/jianyue-ci-gateway'))
    wrapper = pathlib.Path('/usr/local/sbin/jianyue-deploy')
    wrapper.write_text('#!/bin/sh\nexec /usr/bin/python3 -I /usr/local/libexec/jianyue-deploy.py "$@"\n')
    os.chown(str(wrapper), 0, 0)
    os.chmod(str(wrapper), 0o755)
    user = 'jianyue-deploy'
    try:
        account = pwd.getpwnam(user)
        if account.pw_dir != '/var/lib/jianyue-deploy':
            raise RuntimeError('Existing deployment account has an unexpected home directory')
    except KeyError:
        subprocess.run(['useradd', '--system', '--create-home', '--home-dir', '/var/lib/jianyue-deploy', '--shell', '/bin/sh', user], check=True)
    subprocess.run(['usermod', '--password', '*', user], check=True)
    home = pathlib.Path('/var/lib/jianyue-deploy')
    ssh = home / '.ssh'
    ssh.mkdir(parents=True, exist_ok=True)
    for directory in [home, ssh]:
        os.chown(str(directory), 0, 0)
        os.chmod(str(directory), 0o755)
    authorized = ssh / 'authorized_keys'
    existing = authorized.read_text().splitlines() if authorized.exists() else []
    # This dedicated account is managed only by this installer.
    line = 'restrict,command="/usr/local/sbin/jianyue-ci-gateway" ' + public
    if existing and existing != [line]:
        private_backup = pathlib.Path('/www/backup/jianyue-ci')
        private_backup.mkdir(parents=True, exist_ok=True, mode=0o700)
        shutil.copy2(str(authorized), str(private_backup / 'authorized_keys.before-update'))
    authorized.write_text(line + '\n')
    os.chown(str(authorized), 0, 0)
    os.chmod(str(authorized), 0o644)
    policy = pathlib.Path('/etc/sudoers.d/jianyue-deploy')
    temporary = policy.with_name('jianyue-deploy.tmp')
    temporary.write_text('jianyue-deploy ALL=(root) NOPASSWD: /usr/local/sbin/jianyue-deploy\n')
    os.chmod(str(temporary), 0o440)
    subprocess.run(['visudo', '-cf', str(temporary)], check=True)
    os.replace(str(temporary), str(policy))
    subprocess.run(['systemctl', 'restart', 'jianyue-ai'], check=True)
    print('Dedicated deploy account installed. Its SSH key cannot open a shell or forward ports.')
    print('Application environment and database remain in /www/jianyue-data.')


if __name__ == '__main__':
    main()
