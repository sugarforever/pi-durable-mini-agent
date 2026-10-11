import { resolve } from "node:path";

export function createRemoteConfig(projectRoot: string, options: { host?: string; port?: number } = {}) {
	const stateDir = resolve(projectRoot, "experiment/state");
	return {
		target: {
			host: options.host ?? "127.0.0.1",
			port: options.port ?? 2222,
			user: "agent",
			identityFile: resolve(projectRoot, "experiment/keys/demo_key"),
			knownHostsFile: resolve(stateDir, "known_hosts"),
			hostKeyAlias: "pi-durable-mini-agent-remote",
		},
		remoteCwd: "/home/agent/workspace",
		databaseFile: resolve(stateDir, "remote-agent.sqlite"),
	};
}
