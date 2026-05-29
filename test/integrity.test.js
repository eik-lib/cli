import fastify from "fastify";
import { join } from "path";
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import EikService from "@eik/service";
import Sink from "@eik/sink-memory";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cli from "../classes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("integrity", () => {
	let server;
	let address;
	let token;

	beforeEach(async () => {
		server = fastify({ logger: false, forceCloseConnections: true });
		const memSink = new Sink();
		const service = new EikService({ customSink: memSink });
		server.register(service.api());
		address = await server.listen({
			host: "127.0.0.1",
			port: 0,
		});

		token = await cli.login({
			server: address,
			key: "change_me",
		});
	});

	afterEach(async () => {
		await server.close();
	});

	test("package integrity", async () => {
		await cli.publish({
			cwd: __dirname,
			server: address,
			name: "my-app",
			token,
			version: "1.0.0",
			files: {
				"index.js": join(__dirname, "./fixtures/client.js"),
				"index.css": join(__dirname, "./fixtures/styles.css"),
			},
		});

		const result = await cli.integrity({
			server: address,
			name: "my-app",
			version: "1.0.0",
			type: "package",
		});

		assert.strictEqual(result.name, "my-app");
		assert.strictEqual(result.version, "1.0.0");
		assert.ok(result.integrity);
		assert.strictEqual(result.files[0].pathname, "/eik.json");
		assert.ok(result.files[0].integrity);
		assert.strictEqual(result.files[1].pathname, "/index.js");
		assert.ok(result.files[1].integrity);
		assert.strictEqual(result.files[2].pathname, "/index.css");
		assert.ok(result.files[2].integrity);
	});
});
