import { homedir } from "node:os";
import { join } from "node:path";
import { createModels } from "@earendil-works/pi-ai/models";
import { deepseekProvider } from "@earendil-works/pi-ai/providers/deepseek";
import { formatSkillsForPrompt, loadSkills } from "@earendil-works/pi-coding-agent";
import { createRegistry, defineExtension, Harness, section, watchEvents } from "@earendil-works/pi-durable";
import { NodeExecutionEnv } from "@earendil-works/pi-durable/env/node";
import { openNodeSqliteStorage } from "@earendil-works/pi-durable/storage/sqlite/node";
import { CodingTools } from "@earendil-works/pi-durable/tools";
import { context, runRepl } from "./shared.ts";

const cwd = process.cwd();
const models = createModels();
models.setProvider(deepseekProvider());
const { skills } = loadSkills({ cwd, agentDir: join(homedir(), ".pi", "agent"), skillPaths: [], includeDefaults: true });
const registry = createRegistry();
registry.install(CodingTools);
registry.install(defineExtension({
	name: "mini-agent",
	sections: [
		section("preamble", () => "You are a concise coding assistant. Use the tools to work in the current directory.", { tag: false }),
		section("skills", () => formatSkillsForPrompt(skills), { tag: false }),
		section("cwd", (input) => input.env?.cwd),
	],
}));

const harness = await Harness.open(
	await openNodeSqliteStorage(join(cwd, ".mini-agent.sqlite")),
	{ models, registry, env: ({ cwd: dir }) => new NodeExecutionEnv({ cwd: dir ?? cwd }) },
	context,
);
const root = await harness.root(context, { agent: { model: { provider: "deepseek", modelId: "deepseek-flash" }, cwd } });
harness.resume();
const events = await watchEvents(harness, root.id, context);
events.start(async (batch) => {
	for (const event of batch) if (event.type === "tool_execution_start") console.log(`  → ${event.toolName} ${JSON.stringify(event.args).slice(0, 96)}`);
});
await runRepl(harness, root, `mini-agent v3 · ${skills.length} skills`);
await events.stop();
await harness.close(context);

