import fastify from "fastify";
import { promises as fs } from "fs";
import os from "os";
import { exec as execCallback } from "child_process";
import { join, basename, sep } from "path";
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import EikService from "@eik/service";
import Sink from "@eik/sink-memory";
import cli from "../../classes/index.js";
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

describe("integration: integrity", () => {
	let server;
	let address;
	let folder;
	let token;

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

		token = await cli.login({
			server: address,
			key: "change_me",
		});
	});

	afterEach(async () => {
		await server.close();
	});

	test("eik meta : details provided by eik.json", async () => {
		const assets = {
			name: "test-app",
			version: "1.0.0",
			server: address,
			files: {
				"index.js": join(__dirname, "..", "fixtures/client.js"),
				"index.css": join(__dirname, "../fixtures/styles.css"),
			},
		};
		await fs.writeFile(join(folder, "eik.json"), JSON.stringify(assets));

		const eik = join(__dirname, "..", "..", "index.js");

		let cmd = `node ${eik} package --token ${token} --cwd ${folder}`;
		let out = await exec(cmd);
		assert.strictEqual(out.error, null);

		cmd = `node ${eik} integrity --cwd ${folder}`;

		out = await exec(cmd);
		assert.strictEqual(out.error, null);

		const integrity = JSON.parse(
			await fs.readFile(join(folder, ".eik", "integrity.json"), "utf8"),
		);

		assert.ok(
			out.stdout.includes(
				`integrity information for package "test-app" (v1.0.0) saved to ".eik${sep}integrity.json"`,
			),
		);
		assert.strictEqual(integrity.name, "test-app");
		assert.strictEqual(integrity.version, "1.0.0");
		assert.ok(integrity.integrity);
	});

	test("eik meta : details provided by eik.json - npm namespace", async () => {
		const assets = {
			name: "test-app-npm",
			version: "1.0.0",
			type: "npm",
			server: address,
			files: {
				"index.js": join(__dirname, "..", "fixtures", "client.js"),
				"index.css": join(__dirname, "..", "fixtures", "styles.css"),
			},
		};
		await fs.writeFile(join(folder, "eik.json"), JSON.stringify(assets));

		const eik = join(__dirname, "..", "../index.js");

		let cmd = `node ${eik} package --token ${token} --cwd ${folder}`;
		let out = await exec(cmd);
		assert.strictEqual(out.error, null);

		cmd = `node ${eik} integrity --cwd ${folder}`;
		out = await exec(cmd);
		assert.strictEqual(out.error, null);

		const integrity = JSON.parse(
			await fs.readFile(join(folder, ".eik", "integrity.json"), "utf8"),
		);

		assert.ok(
			out.stdout.includes(
				`integrity information for package "test-app-npm" (v1.0.0) saved to ".eik${sep}integrity.json"`,
			),
		);
		assert.strictEqual(integrity.name, "test-app-npm");
		assert.strictEqual(integrity.version, "1.0.0");
		assert.ok(integrity.integrity);
		assert.strictEqual(integrity.files.length, 3);
		assert.strictEqual(integrity.files[0].pathname, "/eik.json");
		assert.ok(integrity.files[0].integrity);
	});
});
