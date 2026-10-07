import { join } from "node:path";
import { createModels } from "@earendil-works/pi-ai/models";
import { deepseekProvider } from "@earendil-works/pi-ai/providers/deepseek";
import { createRegistry, Harness } from "@earendil-works/pi-durable";
import { NodeExecutionEnv } from "@earendil-works/pi-durable/env/node";
import { openNodeSqliteStorage } from "@earendil-works/pi-durable/storage/sqlite/node";
import { context, runRepl } from "./shared.ts";

const cwd = process.cwd();
const models = createModels();
models.setProvider(deepseekProvider());

const harness = await Harness.open(
	await openNodeSqliteStorage(join(cwd, ".mini-agent.sqlite")),
	{ models, registry: createRegistry(), env: ({ cwd: dir }) => new NodeExecutionEnv({ cwd: dir ?? cwd }) },
	context,
);
const root = await harness.root(context, { agent: { model: { provider: "deepseek", modelId: "deepseek-flash" }, cwd } });
await runRepl(harness, root, "mini-agent v1 · DeepSeek");
await harness.close(context);

