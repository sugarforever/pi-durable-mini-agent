import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { createInterface } from "node:readline/promises";
import { createModels } from "@earendil-works/pi-ai/models";
import { deepseekProvider } from "@earendil-works/pi-ai/providers/deepseek";
import { createRegistry, Harness, watchEvents } from "@earendil-works/pi-durable";
import { openNodeSqliteStorage } from "@earendil-works/pi-durable/storage/sqlite/node";
import { CodingTools } from "@earendil-works/pi-durable/tools";
import { acceptHostKey, RemoteExecutionEnv, scanHostKey, sshConnection } from "@earendil-works/pi-env";
import { createRemoteConfig } from "./remote-config.ts";
import { formatRemoteToolCall } from "./remote-events.ts";
import { context, runRepl } from "./shared.ts";

const projectRoot = process.cwd();
const remoteHost = process.env.PI_REMOTE_HOST?.trim() || "127.0.0.1";
const remotePort = Number.parseInt(process.env.PI_REMOTE_PORT ?? "2222", 10);
if (!Number.isInteger(remotePort) || remotePort < 1 || remotePort > 65535) {
	throw new Error("PI_REMOTE_PORT must be an integer between 1 and 65535");
}
const config = createRemoteConfig(projectRoot, { host: remoteHost, port: remotePort });
await mkdir(dirname(config.databaseFile), { recursive: true });

if (process.argv[2] === "trust") {
	const scanned = await scanHostKey(config.target);
	console.log("Remote host key fingerprints:");
	console.log(scanned.fingerprints.join("\n"));
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	const answer = await rl.question("Compare this fingerprint with the container host key. Trust it? [yes/N] ");
	rl.close();
	if (answer.trim().toLowerCase() !== "yes") {
		console.log("Host key was not trusted.");
		process.exit(1);
	}
	await acceptHostKey(config.target, scanned.lines);
	console.log(`trusted=${config.target.knownHostsFile}`);
	process.exit(0);
}

const lazy = sshConnection(config.target);
const remoteEnv = new RemoteExecutionEnv({
	connection: lazy.connection,
	id: "pi-env:mini-agent-remote",
	cwd: config.remoteCwd,
});
const models = createModels();
models.setProvider(deepseekProvider());
const registry = createRegistry();
registry.install(CodingTools);

const harness = await Harness.open(
	await openNodeSqliteStorage(config.databaseFile),
	{ models, registry, env: () => remoteEnv },
	context,
);
const root = await harness.root(context, {
	agent: { model: { provider: "deepseek", modelId: "deepseek-flash" }, cwd: config.remoteCwd },
});
harness.resume();

const events = await watchEvents(harness, root.id, context);
events.start(async (batch) => {
	for (const event of batch) {
		if (event.type === "tool_execution_start") {
			console.log(`  ${formatRemoteToolCall(event.toolName, event.args)}`);
		}
	}
});

console.log(`local-control-plane=${config.databaseFile}`);
console.log(`remote-workspace=${config.target.user}@${config.target.host}:${config.remoteCwd}`);
await runRepl(harness, root, "mini-agent v5 · Durable Agent + RemoteExecutionEnv", config.databaseFile);
await events.stop();
await harness.close(context);
lazy.connection.close();
