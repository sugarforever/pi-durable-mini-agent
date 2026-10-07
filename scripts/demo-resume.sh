#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
db="workspace/.resume.sqlite"
log="workspace/.resume-start.log"
rm -f "$db" "$db-shm" "$db-wal" "$log"

node --no-warnings --experimental-strip-types src/v4-resume.ts start "$db" >"$log" 2>&1 &
pid=$!
sleep 3
kill -9 "$pid" 2>/dev/null || true
wait "$pid" 2>/dev/null || true
cat "$log"
printf '\n--- restarting with the same SQLite database ---\n'
node --no-warnings --experimental-strip-types src/v4-resume.ts resume "$db"
