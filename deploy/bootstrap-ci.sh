#!/bin/bash
set -euo pipefail
if [ "$(id -u)" -ne 0 ] || [ "$#" -ne 2 ] || ! [[ "$1" =~ ^[a-f0-9]{40}$ ]]; then
    echo 'Usage (root): bash bootstrap-ci.sh FULL_COMMIT_SHA "ssh-ed25519 PUBLIC_KEY comment"' >&2
    exit 1
fi
commit="$1"
setup="/www/backup/jianyue-ci-setup/$commit"
install -d -m 700 "$setup"
base="https://raw.githubusercontent.com/lovsc/JianYue-AI/$commit/deploy"
for file in install-ci.py server-deploy.py ci-gateway.py SHA256SUMS; do
    curl -fsSL --connect-timeout 15 --max-time 90 --retry 2 "$base/$file" -o "$setup/$file"
done
(cd "$setup" && sha256sum -c SHA256SUMS)
printf '%s\n' "$2" > "$setup/ci.pub"
chmod 600 "$setup/ci.pub"
python3 "$setup/install-ci.py" "$setup/ci.pub"
curl -fsS --retry 5 --retry-connrefused --retry-delay 1 --max-time 10 http://127.0.0.1:3000/api/v1/health
printf '\nCI_SETUP_READY\n'
