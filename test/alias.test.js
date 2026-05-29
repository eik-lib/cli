import fastify from "fastify";
import { promises as fs } from "fs";
import os from "os";
import { join, basename } from "path";
import { mockLogger } from "./utils.js";
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import EikService from "@eik/service";
import Sink from "@eik/sink-memory";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cli from "../classes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("alias", () => {
	let server;
	let address;
	let token;
	let cwd;

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

		cwd = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));
	});

	afterEach(async () => {
		await server.close();
	});

	test("Creating a package alias", async () => {
		await cli.publish({
			server: address,
			name: "my-pack",
			version: "1.0.0",
			token,
			cwd,
			files: {
				"./index.js": join(__dirname, "./fixtures/client.js"),
				"./index.css": join(__dirname, "./fixtures/styles.css"),
			},
		});

		const result = await cli.alias({
			server: address,
			type: "package",
			name: "my-pack",
			version: "1.0.0",
			alias: "1",
			token,
		});

		assert.ok(
			result.server.includes("127.0.0.1"),
			'server property should return "127.0.0.1"',
		);
		assert.strictEqual(result.type, "pkg", 'type property should return "pkg"');
		assert.strictEqual(
			result.name,
			"my-pack",
			'name property should return "my-pack"',
		);
		assert.strictEqual(result.alias, "1", "alias property should return 1");
		assert.strictEqual(
			result.version,
			"1.0.0",
			"version property should return 1.0.0",
		);
		assert.strictEqual(
			result.update,
			false,
			"update property should return false",
		);
		assert.strictEqual(result.files.length, 3, "files property should be 3");
		assert.strictEqual(
			result.org,
			"local",
			"org property should return an organisation",
		);
		assert.ok(
			result.integrity.includes("=="),
			"integrity property should contain an integrity string",
		);
	});

	test("Creating an npm alias", async () => {
		const l = mockLogger();

		await cli.publish({
			server: address,
			name: "lit-html",
			version: "1.1.2",
			token,
			cwd,
			type: "npm",
			files: {
				"index.js": join(__dirname, "./fixtures/client.js"),
			},
		});

		const result = await cli.alias({
			logger: l.logger,
			server: address,
			type: "npm",
			name: "lit-html",
			version: "1.1.2",
			alias: "1",
			token,
		});

		assert.ok(
			result.server.includes("127.0.0.1"),
			'server property should return "127.0.0.1"',
		);
		assert.strictEqual(result.type, "npm", 'type property should return "npm"');
		assert.strictEqual(
			result.name,
			"lit-html",
			'name property should return "lit-html"',
		);
		assert.strictEqual(result.alias, "1", "alias property should return 1");
		assert.strictEqual(
			result.version,
			"1.1.2",
			"version property should return 1.1.2",
		);
		assert.strictEqual(
			result.update,
			false,
			"update property should return false",
		);
		assert.strictEqual(result.files.length, 2, "files property should be 2");
		assert.strictEqual(
			result.org,
			"local",
			"org property should return an organisation",
		);
		assert.ok(
			result.integrity.includes("=="),
			"integrity property should contain an integrity string",
		);
	});

	test("Creating an image alias", async () => {
		const l = mockLogger();

		await cli.publish({
			server: address,
			name: "lit-html",
			version: "1.1.2",
			token,
			cwd,
			type: "image",
			files: {
				"index.js": join(__dirname, "./fixtures/client.js"),
			},
		});

		const result = await cli.alias({
			logger: l.logger,
			server: address,
			type: "image",
			name: "lit-html",
			version: "1.1.2",
			alias: "1",
			token,
		});

		assert.ok(
			result.server.includes("127.0.0.1"),
			'server property should return "127.0.0.1"',
		);
		assert.strictEqual(result.type, "img", 'type property should return "img"');
		assert.strictEqual(
			result.name,
			"lit-html",
			'name property should return "lit-html"',
		);
		assert.strictEqual(result.alias, "1", "alias property should return 1");
		assert.strictEqual(
			result.version,
			"1.1.2",
			"version property should return 1.1.2",
		);
		assert.strictEqual(
			result.update,
			false,
			"update property should return false",
		);
		assert.strictEqual(result.files.length, 2, "files property should be 2");
		assert.strictEqual(
			result.org,
			"local",
			"org property should return an organisation",
		);
		assert.ok(
			result.integrity.includes("=="),
			"integrity property should contain an integrity string",
		);
	});

	test("Creating a map alias", async () => {
		const l = mockLogger();

		await cli.map({
			server: address,
			name: "my-map",
			version: "1.0.0",
			file: join(__dirname, "fixtures/import-map.json"),
			token,
			cwd,
		});

		const result = await cli.alias({
			logger: l.logger,
			server: address,
			type: "map",
			name: "my-map",
			version: "1.0.0",
			alias: "1",
			token,
		});

		assert.ok(
			result.server.includes("127.0.0.1"),
			'server property should return "127.0.0.1"',
		);
		assert.strictEqual(result.type, "map", 'type property should return "map"');
		assert.strictEqual(
			result.name,
			"my-map",
			'name property should return "my-map"',
		);
		assert.strictEqual(result.alias, "1", "alias property should return 1");
		assert.strictEqual(
			result.version,
			"1.0.0",
			"version property should return 1.0.0",
		);
		assert.strictEqual(
			result.update,
			false,
			"update property should return false",
		);
		assert.strictEqual(result.files.length, 0, "files property should be 0");
		assert.ok(!result.org, "org property should not be present");
		assert.ok(!result.integrity, "integrity property should not be present");
	});
});
