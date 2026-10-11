#!/usr/bin/env bash
set -euo pipefail

install -o agent -g agent -m 600 /demo-key.pub /home/agent/.ssh/authorized_keys
ssh-keygen -A
exec /usr/sbin/sshd -D -e
