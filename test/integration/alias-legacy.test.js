import fastify from "fastify";
import { promises as fs } from "node:fs";
import os from "node:os";
import { exec as execCallback } from "child_process";
import { join, basename } from "node:path";
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

describe("integration: alias legacy", () => {
	let server;
	let address;
	let folder;
	let token;

	beforeEach(async () => {
		const memSink = new Sink();
		server = fastify({ logger: false, forceCloseConnections: true });
		const service = new EikService({ customSink: memSink });
		server.register(service.api());
		address = await server.listen({ host: "127.0.0.1", port: 0 });
		folder = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));

		const eik = join(__dirname, "..", "..", "index.js");

		token = await cli.login({ server: address, key: "change_me" });

		const assets = {
			name: "scroll-into-view-if-needed",
			version: "2.2.24",
			type: "npm",
			server: address,
			files: {
				"index.js": join(__dirname, "..", "fixtures", "client.js"),
				"index.css": join(__dirname, "..", "fixtures", "styles.css"),
			},
		};

		await fs.writeFile(join(folder, "eik.json"), JSON.stringify(assets));

		const cmd = `node ${eik} package --token ${token} --cwd ${folder}`;
		await exec(cmd);

		const map = {
			imports: {
				"scroll-into-view-if-needed": new URL(
					"/npm/scroll-into-view-if-needed/2.2.24/index.js",
					address,
				).href,
			},
		};
		await fs.writeFile(join(folder, "import-map.json"), JSON.stringify(map));
		const mapCmd = `node ${eik} map test-map 1.0.0 import-map.json
        --token ${token}
        --server ${address}
        --cwd ${folder}`;
		await exec(mapCmd.split("\n").join(" "));
	});

	afterEach(async () => {
		await server.close();
	});

	test("eik package-alias <name> <version> <alias>", async () => {
		const eik = join(__dirname, "..", "..", "index.js");

		const assets = {
			server: address,
			name: "my-pack",
			version: "1.0.0",
			files: {
				"index.js": join(__dirname, "..", "fixtures", "client.js"),
				"index.css": join(__dirname, "..", "fixtures", "styles.css"),
			},
		};

		await fs.writeFile(join(folder, "eik.json"), JSON.stringify(assets));

		const cmd1 = `node ${eik} package --token ${token} --cwd ${folder}`;
		let out = await exec(cmd1);
		if (out.error) {
			assert.strictEqual(out.error, null);
		}

		const cmd2 = `node ${eik} package-alias my-pack 1.0.0 1
        --token ${token}
        --server ${address}
        --cwd ${folder}`;

		out = await exec(cmd2.split("\n").join(" "));
		if (out.error) {
			assert.strictEqual(out.error, null);
		}

		const res = await fetch(new URL("/pkg/my-pack/v1/index.js", address));

		assert.ok(out.stdout.includes("PACKAGE"));
		assert.ok(out.stdout.includes("my-pack"));
		assert.ok(out.stdout.includes("1.0.0"));
		assert.ok(out.stdout.includes("v1"));
		assert.ok(out.stdout.includes("NEW"));
		assert.strictEqual(res.ok, true);
	});

	test("eik npm-alias <name> <version> <alias> --token --server : no eik.json or .eikrc", async () => {
		const eik = join(__dirname, "..", "..", "index.js");
		const cmd = `node ${eik} npm-alias scroll-into-view-if-needed 2.2.24 2
        --token ${token}
        --server ${address}
        --cwd ${folder}`;

		const { stdout, error } = await exec(cmd.split("\n").join(" "));

		const res = await fetch(
			new URL("/npm/scroll-into-view-if-needed/v2/index.js", address),
		);

		assert.ok(stdout.includes("NPM"));
		assert.ok(stdout.includes("scroll-into-view-if-needed"));
		assert.ok(stdout.includes("2.2.24"));
		assert.ok(stdout.includes("v2"));
		assert.ok(stdout.includes("NEW"));
		assert.strictEqual(res.ok, true);
		assert.strictEqual(error, null);
	});

	test("eik npm-alias <name> <version> <alias> : publish details provided by eik.json file", async () => {
		const assets = {
			name: "test-app",
			version: "1.0.0",
			server: address,
			files: {
				"index.js": join(__dirname, "..", "fixtures", "client.js"),
				"index.css": join(__dirname, "..", "fixtures", "styles.css"),
			},
		};
		await fs.writeFile(join(folder, "eik.json"), JSON.stringify(assets));
		const eik = join(__dirname, "..", "..", "index.js");
		const cmd = `node ${eik} npm-alias scroll-into-view-if-needed 2.2.24 2 --token ${token} --cwd ${folder}`;

		const { stdout, error } = await exec(cmd);

		const res = await fetch(
			new URL("/npm/scroll-into-view-if-needed/v2/index.js", address),
		);

		assert.ok(stdout.includes("NPM"));
		assert.ok(stdout.includes("scroll-into-view-if-needed"));
		assert.ok(stdout.includes("2.2.24"));
		assert.ok(stdout.includes("v2"));
		assert.ok(stdout.includes("NEW"));
		assert.strictEqual(res.ok, true);
		assert.strictEqual(error, null);
	});

	test("eik map-alias <name> <version> <alias> --token --server : no eik.json or .eikrc", async () => {
		const eik = join(__dirname, "..", "..", "index.js");
		const cmd = `node ${eik} map-alias test-map 1.0.0 1
        --token ${token}
        --server ${address}
        --cwd ${folder}`;

		const { stdout, error } = await exec(cmd.split("\n").join(" "));

		const res = await fetch(new URL("/map/test-map/v1", address));

		assert.ok(stdout.includes("MAP"));
		assert.ok(stdout.includes("test-map"));
		assert.ok(stdout.includes("1.0.0"));
		assert.ok(stdout.includes("v1"));
		assert.ok(stdout.includes("NEW"));
		assert.strictEqual(res.ok, true);
		assert.strictEqual(error, null);
	});

	test("eik map-alias <name> <version> <alias> : publish details provided by eik.json file", async () => {
		const assets = {
			name: "test-app",
			version: "1.0.0",
			server: address,
			files: {
				"index.js": join(__dirname, "..", "fixtures", "client.js"),
				"index.css": join(__dirname, "..", "fixtures", "styles.css"),
			},
		};
		await fs.writeFile(join(folder, "eik.json"), JSON.stringify(assets));
		const eik = join(__dirname, "..", "..", "index.js");
		const cmd = `node ${eik} map-alias test-map 1.0.0 1 --token ${token} --cwd ${folder}`;

		const { stdout, error } = await exec(cmd);

		const res = await fetch(new URL("/map/test-map/v1", address));

		assert.ok(stdout.includes("MAP"));
		assert.ok(stdout.includes("test-map"));
		assert.ok(stdout.includes("1.0.0"));
		assert.ok(stdout.includes("v1"));
		assert.ok(stdout.includes("NEW"));
		assert.strictEqual(res.ok, true);
		assert.strictEqual(error, null);
	});
});
