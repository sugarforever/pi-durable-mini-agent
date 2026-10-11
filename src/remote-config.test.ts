import assert from "node:assert/strict";
import { test } from "node:test";
import { resolve } from "node:path";
import { createRemoteConfig } from "./remote-config.ts";

test("remote config keeps SSH trust and identity inside the demo project", () => {
	const root = resolve("/tmp/pi-durable-mini-agent");
	const config = createRemoteConfig(root);

	assert.equal(config.target.host, "127.0.0.1");
	assert.equal(config.target.port, 2222);
	assert.equal(config.target.user, "agent");
	assert.equal(config.target.hostKeyAlias, "pi-durable-mini-agent-remote");
	assert.equal(config.target.identityFile, resolve(root, "experiment/keys/demo_key"));
	assert.equal(config.target.knownHostsFile, resolve(root, "experiment/state/known_hosts"));
	assert.equal(config.remoteCwd, "/home/agent/workspace");
	assert.equal(config.databaseFile, resolve(root, "experiment/state/remote-agent.sqlite"));
});

test("remote config accepts a different host port for parallel demos", () => {
	const config = createRemoteConfig(resolve("/tmp/pi-durable-mini-agent"), { host: "remote.example.test", port: 2223 });
	assert.equal(config.target.host, "remote.example.test");
	assert.equal(config.target.port, 2223);
});
