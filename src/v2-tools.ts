import { join } from "node:path";
import { createModels } from "@earendil-works/pi-ai/models";
import { deepseekProvider } from "@earendil-works/pi-ai/providers/deepseek";
import { createRegistry, Harness, watchEvents } from "@earendil-works/pi-durable";
import { NodeExecutionEnv } from "@earendil-works/pi-durable/env/node";
import { openNodeSqliteStorage } from "@earendil-works/pi-durable/storage/sqlite/node";
import { CodingTools } from "@earendil-works/pi-durable/tools";
import { context, runRepl } from "./shared.ts";

const cwd = process.cwd();
const models = createModels();
models.setProvider(deepseekProvider());
const registry = createRegistry();
registry.install(CodingTools);

const harness = await Harness.open(
	await openNodeSqliteStorage(join(cwd, ".mini-agent.sqlite")),
	{ models, registry, env: ({ cwd: dir }) => new NodeExecutionEnv({ cwd: dir ?? cwd }) },
	context,
);
const root = await harness.root(context, { agent: { model: { provider: "deepseek", modelId: "deepseek-flash" }, cwd } });
const events = await watchEvents(harness, root.id, context);
events.start(async (batch) => {
	for (const event of batch) if (event.type === "tool_execution_start") console.log(`  → ${event.toolName} ${JSON.stringify(event.args).slice(0, 96)}`);
});
await runRepl(harness, root, "mini-agent v2 · CodingTools");
await events.stop();
await harness.close(context);

