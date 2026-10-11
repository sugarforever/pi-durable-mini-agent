import assert from "node:assert/strict";
import { test } from "node:test";
import { formatRemoteToolCall } from "./remote-events.ts";

test("formats coding tool calls without truncating JSON", () => {
	assert.equal(formatRemoteToolCall("read", { path: "hello_remote.py" }), "REMOTE → read hello_remote.py");
	assert.equal(
		formatRemoteToolCall("edit", { path: "hello_remote.py", edits: [{ oldText: "old", newText: "new" }] }),
		"REMOTE → edit hello_remote.py (1 change)",
	);
	assert.equal(formatRemoteToolCall("bash", { command: "python3 hello_remote.py" }), "REMOTE → bash python3 hello_remote.py");
});
