type ToolArgs = Record<string, unknown>;

export function formatRemoteToolCall(toolName: string, args: ToolArgs): string {
	if (toolName === "read" && typeof args.path === "string") return `REMOTE → read ${args.path}`;
	if (toolName === "write" && typeof args.path === "string") return `REMOTE → write ${args.path}`;
	if (toolName === "edit" && typeof args.path === "string" && Array.isArray(args.edits)) {
		const count = args.edits.length;
		return `REMOTE → edit ${args.path} (${count} ${count === 1 ? "change" : "changes"})`;
	}
	if (toolName === "bash" && typeof args.command === "string") return `REMOTE → bash ${args.command}`;
	return `REMOTE → ${toolName} ${JSON.stringify(args)}`;
}
