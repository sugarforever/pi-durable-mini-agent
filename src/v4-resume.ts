import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import { Type } from "@earendil-works/pi-ai";
import { createModels } from "@earendil-works/pi-ai/models";
import { fauxAssistantMessage, fauxProvider, fauxToolCall } from "@earendil-works/pi-ai/providers/faux";
import { createRegistry, defineExtension, defineTool, Harness } from "@earendil-works/pi-durable";
import { openNodeSqliteStorage } from "@earendil-works/pi-durable/storage/sqlite/node";

const context = BACKGROUND_CONTEXT;
const [phase, db] = process.argv.slice(2);
if ((phase !== "start" && phase !== "resume") || !db) throw new Error("Usage: v4-resume.ts <start|resume> <database>");

const slow = (name: string, replay: "safe" | "unsafe") => defineTool({
	name,
	description: name,
	replay,
	parameters: Type.Object({ steps: Type.Number() }),
	execute: async (args, api) => {
		for (let i = 1; i <= args.steps; i++) {
			api.output(`${name} step ${i}\n`);
			console.log(`[${phase}] ${name} step ${i}`);
			await new Promise((resolve) => setTimeout(resolve, 400));
		}
		return {};
	},
});

const registry = createRegistry();
registry.install(defineExtension({ name: "demo", tools: [slow("fetch_report", "safe"), slow("send_email", "unsafe")] }));
const faux = fauxProvider();
const models = createModels();
models.setProvider(faux.provider);
if (phase === "start") {
	faux.setResponses([fauxAssistantMessage([
		fauxToolCall("fetch_report", { steps: 12 }),
		fauxToolCall("send_email", { steps: 12 }),
	], { stopReason: "toolUse" })]);
} else {
	faux.setResponses([fauxAssistantMessage("Report fetched. The email was interrupted, so I did not resend it.")]);
}

const harness = await Harness.open(
	await openNodeSqliteStorage(db),
	{ models, registry, settings: { toolExecution: "parallel" } },
	context,
);
const root = await harness.root(context, { agent: { model: { provider: "faux", modelId: "faux-1" } } });

if (phase === "start") {
	const submission = await root.submit({ type: "input", content: "Fetch the report and email it.", requestId: "job-1" }, context);
	console.log(`[start] submitted ${submission.id}; pid ${process.pid}`);
	await submission.wait(context);
} else {
	const submission = await root.submit({ type: "input", content: "Fetch the report and email it.", requestId: "job-1" }, context);
	console.log(`[resume] same requestId -> submission ${submission.id}`);
	harness.resume();
	const settled = await submission.wait(context);
	console.log(`[resume] status: ${settled.status}`);
}
await harness.close(context);
