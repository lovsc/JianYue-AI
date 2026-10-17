#!/usr/bin/python3
import os
import re
import sys

command = os.environ.get('SSH_ORIGINAL_COMMAND', '')
match = re.fullmatch(r'deploy ([a-f0-9]{40}) ([a-f0-9]{64})', command)
if not match:
    print('This key can only run the JianYue release deployment command.', file=sys.stderr)
    sys.exit(1)
os.execv('/usr/bin/sudo', ['sudo', '-n', '/usr/local/sbin/jianyue-deploy', match.group(1), match.group(2)])
