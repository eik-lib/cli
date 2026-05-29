import fastify from "fastify";
import { promises as fs } from "fs";
import os from "os";
import { exec as execCallback } from "child_process";
import { join, basename } from "path";
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import EikService from "@eik/service";
import Sink from "@eik/sink-memory";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function exec(cmd) {
	return new Promise((resolve) => {
		execCallback(cmd, (error, stdout, stderr) => {
			resolve({ error, stdout, stderr });
		});
	});
}

describe("integration: login", () => {
	let server;
	let address;
	let folder;

	beforeEach(async () => {
		const memSink = new Sink();
		server = fastify({ logger: false, forceCloseConnections: true });
		const service = new EikService({ customSink: memSink });
		server.register(service.api());
		address = await server.listen({
			host: "127.0.0.1",
			port: 0,
		});

		folder = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));
	});

	afterEach(async () => {
		await server.close();
	});

	test("eik login --key --server --cwd : valid key", async () => {
		const eik = join(__dirname, "..", "../index.js");
		const cmd = `node ${eik} login --key change_me --server ${address} --cwd ${folder}`;

		const { stdout } = await exec(cmd);

		assert.ok(stdout.includes("Login successful"));
	});

	test("eik login --key --server --cwd : invalid key", async () => {
		const eik = join(__dirname, "..", "..", "index.js");
		const cmd = `node ${eik} login --key invalid --server ${address} --cwd ${folder}`;

		const { stdout } = await exec(cmd);
		assert.ok(stdout.includes("Login unsuccessful"));
	});
});
