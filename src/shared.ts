import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import type { AssistantMessage } from "@earendil-works/pi-ai";
import { AssistantEntry, type Harness } from "@earendil-works/pi-durable";

export const context = BACKGROUND_CONTEXT;

export async function runRepl(harness: Harness, root: Awaited<ReturnType<Harness["root"]>>, label: string) {
	console.log(`${label} · SQLite ${join(process.cwd(), ".mini-agent.sqlite")}`);
	const rl = createInterface({ input: process.stdin });
	if (process.stdin.isTTY) process.stdout.write("\n❯ ");

	for await (const raw of rl) {
		const line = raw.trim();
		if (line === "exit") break;
		if (!line) continue;
		if (!process.stdin.isTTY) console.log(`❯ ${line}`);
		const settled = await (await root.submit({ type: "input", content: line }, context)).wait(context);
		if (settled.status === "done" && settled.type === "input") {
			const entry = await root.commit((tx) => tx.entry(AssistantEntry, settled.answer), context);
			const message = entry?.model?.[0] as AssistantMessage | undefined;
			console.log(message?.content.flatMap((item) => item.type === "text" ? [item.text] : []).join("") ?? "");
		} else {
			console.log(`no answer: ${settled.status}`);
		}
		if (process.stdin.isTTY) process.stdout.write("\n❯ ");
	}

	rl.close();
}

