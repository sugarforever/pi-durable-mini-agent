# Pi Durable Mini Agent

A small, runnable project that introduces Pi Durable in five incremental versions. It starts with a model-backed agent whose conversation is stored in SQLite, then adds coding tools, project skills, crash recovery, and an SSH-backed remote execution environment.

## What you will build

1. **V1: Model + SQLite** - ask DeepSeek a question and persist the conversation locally.
2. **V2: Coding tools** - let the agent read, write, edit, and run shell commands.
3. **V3: Skills** - load user-level and project-level skills into the agent instructions.
4. **V4: Crash recovery** - terminate a process during tool execution, reopen the same SQLite database, and resume safely.
5. **V5: Remote execution** - keep the Durable control plane, model credentials, and SQLite database local while the coding tools operate in a remote Linux workspace over SSH.

V1-V3 and V5 use DeepSeek. V4 uses Pi AI's deterministic faux provider so the recovery experiment is repeatable and does not require an API call.

## Requirements

- Node.js 22.6 or newer
- npm
- A DeepSeek API key for V1-V3 and V5
- Docker and an SSH client for the self-contained V5 demo

## Install

```bash
git clone https://github.com/sugarforever/pi-durable-mini-agent.git
cd pi-durable-mini-agent
npm install
```

Export your API key before running a DeepSeek-backed example:

```bash
export DEEPSEEK_API_KEY="your-key"
```

The project does not load `.env` automatically. `.env`, SQLite databases, generated SSH keys, and project-level SSH state are ignored by Git.

## V1: Minimal durable agent

```bash
npm run v1
```

Enter a message at the prompt. The program creates `.mini-agent.sqlite` in the repository root. Type `exit` to stop it; the next run reopens the same conversation database.

## V2: Add coding tools

```bash
npm run v2
```

Try:

```text
Read src/checkout.ts and tell me which TODO items remain.
```

This version installs `CodingTools`, which gives the agent file read/write/edit operations and a shell tool. Tool calls are printed in the terminal.

## V3: Add skills

```bash
npm run v3
```

Try:

```text
Scan the project for TODO and FIXME comments and create a report using the project skill.
```

The agent discovers `workspace/.pi/skills/todo-report/SKILL.md` and writes `workspace/TODO-REPORT.md`. The generated report is ignored by Git, so the experiment can be repeated safely.

## V4: Simulate a crash and resume

Run the automated experiment:

```bash
npm run demo:resume
```

The script:

1. starts the slow `fetch_report` and `send_email` tools;
2. terminates the Node.js process while they are running;
3. reopens the same `workspace/.resume.sqlite` database;
4. calls `harness.resume()` to recover the task.

`fetch_report` declares `replay: "safe"`, so it can run again and finish. `send_email` declares `replay: "unsafe"`, so the harness does not automatically repeat an operation that may already have caused an external effect.

To observe the process manually in two terminals, run:

```bash
npm run v4:start
npm run v4:resume
```

Terminate the first command before it finishes, then run the second command.

## V5: Run coding tools in a remote environment

V5 keeps these components on the local machine:

- Pi Durable `Harness`
- DeepSeek model calls and API credentials
- conversation and task state in SQLite
- SSH identity and `known_hosts`

The built-in coding tools use `RemoteExecutionEnv`, so file and shell operations run in `/home/agent/workspace` on the SSH target.

### 1. Start the demo SSH host

The included Docker container provides a reproducible Ubuntu SSH target with an `agent` user:

```bash
npm run v5:setup
```

The default mapping is `127.0.0.1:2222` to port 22 in the container. If that host port is already in use, choose another one:

```bash
PI_REMOTE_PORT=2223 npm run v5:setup
```

The setup command creates a demo ED25519 client key under `experiment/keys/`, mounts only its public key into the container, starts the container, and prints the container's ED25519 host-key fingerprint. The private key remains on the host.

### 2. Verify and trust the host key

Before the first connection, scan the SSH server's host key:

```bash
npm run v5:trust
```

For a non-default port:

```bash
PI_REMOTE_PORT=2223 npm run v5:trust
```

Compare the displayed fingerprint with the fingerprint printed by `v5:setup`. Type `yes` only when they match. The accepted public key is written to the project-local `experiment/state/known_hosts`; the demo does not use your global `~/.ssh/known_hosts`.

### 3. Start the durable agent

```bash
export DEEPSEEK_API_KEY="your-key"
npm run v5:remote
```

If the demo container is listening on another port, pass the same value again:

```bash
PI_REMOTE_PORT=2223 npm run v5:remote
```

Try this prompt:

```text
Create hello.py in the workspace, make it print "hello from remote workspace", and run it.
```

Real model-selected tool calls are prefixed with `REMOTE →` in the terminal. The generated file exists in the container rather than in the local repository. Verify it independently with:

```bash
docker exec pi-durable-mini-agent-remote find /home/agent/workspace -maxdepth 2 -type f -print
docker exec pi-durable-mini-agent-remote python3 /home/agent/workspace/hello.py
```

### Remote host and port configuration

The V5 client accepts two optional environment variables:

| Variable | Default | Purpose |
|---|---:|---|
| `PI_REMOTE_HOST` | `127.0.0.1` | SSH host used by `v5:trust` and `v5:remote` |
| `PI_REMOTE_PORT` | `2222` | SSH port used by `v5:trust` and `v5:remote`; host port used by `v5:setup` |

These names belong to this example project; Pi Durable and `pi-env` do not map them automatically. `src/v5-remote.ts` reads the variables and passes them to `createRemoteConfig()`, which builds `config.target` for `sshConnection()`.

For an existing remote host, provision the `agent` account and authorized key yourself, then run:

```bash
PI_REMOTE_HOST=build.example.com PI_REMOTE_PORT=22 npm run v5:trust
PI_REMOTE_HOST=build.example.com PI_REMOTE_PORT=22 npm run v5:remote
```

The demo still expects the private key at `experiment/keys/demo_key`, the remote workspace at `/home/agent/workspace`, and the SSH user to be `agent`. Change `src/remote-config.ts` if your deployment uses different values.

## Project layout

```text
src/
  v1-basic.ts          # DeepSeek + SQLite
  v2-tools.ts          # CodingTools
  v3-skills.ts         # user and project skills
  v4-resume.ts         # safe and unsafe recovery experiment
  v5-remote.ts         # durable agent backed by RemoteExecutionEnv
  remote-config.ts     # SSH target, project-local trust, and remote cwd
  remote-events.ts     # concise remote tool-call logging
experiment/
  Dockerfile           # reproducible Ubuntu SSH target
  entrypoint.sh        # configures the agent user's authorized key
scripts/
  demo-resume.sh       # terminates and resumes the V4 process
  setup-remote.sh      # creates the demo key and starts the SSH container
workspace/
  .pi/skills/          # project-level skill used by V3
  src/                 # sample files for the coding agent
```

## Verify the project

```bash
npm test
npm run typecheck
npm run demo:resume
```

The default tests do not invoke DeepSeek. Interactive DeepSeek examples make real API calls and may incur usage charges.

## Security notes

`CodingTools` can read, modify, and execute files in its configured workspace. Run these examples only in the repository or another controlled environment.

The included Docker container demonstrates SSH and remote execution behavior. It is not a production sandbox. Production isolation depends on the container runtime, mounts, network policy, privileges, host configuration, and how secrets are passed to remote commands.

## License

MIT
