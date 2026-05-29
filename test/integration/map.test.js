import fastify from "fastify";
import { promises as fs } from "fs";
import os from "os";
import { exec as execCallback } from "child_process";
import { join, basename } from "path";
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

describe("integration: map", () => {
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

	test("eik map : publish, details provided by eik.json file", async () => {
		const assets = {
			name: "scroll-into-view-if-needed",
			version: "2.2.24",
			server: address,
			files: {
				"index.js": join(__dirname, "..", "fixtures", "client.js"),
				"index.css": join(__dirname, "..", "fixtures", "styles.css"),
			},
		};
		await fs.writeFile(join(folder, "eik.json"), JSON.stringify(assets));

		const map = {
			imports: {
				"scroll-into-view-if-needed": new URL(
					"/npm/scroll-into-view-if-needed/2.2.24/index.js",
					address,
				).href,
			},
		};
		await fs.writeFile(join(folder, "import-map.json"), JSON.stringify(map));

		const eik = join(__dirname, "..", "..", "index.js");
		const cmd = `node ${eik} map test-map 1.0.0 import-map.json --token ${token} --cwd ${folder}`;

		const { error, stdout } = await exec(cmd);

		const res = await fetch(new URL("/map/test-map/1.0.0", address));
		const result = await res.json();

		assert.strictEqual(res.ok, true);
		assert.deepStrictEqual(result, map);
		assert.strictEqual(error, null);
		assert.ok(
			stdout.includes('Published import map "test-map" at version "1.0.0"'),
		);
	});
});
