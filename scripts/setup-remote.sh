#!/usr/bin/env bash
set -euo pipefail

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
remote_port=${PI_REMOTE_PORT:-2222}
key_dir="$project_root/experiment/keys"
mkdir -p "$key_dir" "$project_root/experiment/state"
if [ ! -f "$key_dir/demo_key" ]; then
  ssh-keygen -q -t ed25519 -N '' -f "$key_dir/demo_key"
fi
docker build -t pi-durable-mini-agent-remote -f "$project_root/experiment/Dockerfile" "$project_root/experiment"
docker rm -f pi-durable-mini-agent-remote >/dev/null 2>&1 || true
docker run -d --name pi-durable-mini-agent-remote -p "127.0.0.1:${remote_port}:22" \
  -v "$key_dir/demo_key.pub:/demo-key.pub:ro" \
  pi-durable-mini-agent-remote
echo "remote container ready: 127.0.0.1:${remote_port}"
docker exec pi-durable-mini-agent-remote ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
