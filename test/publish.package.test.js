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

describe("publish package", () => {
	let server;
	let address;
	let token;
	let cwd;

	beforeEach(async () => {
		const memSink = new Sink();
		server = fastify({ logger: false, forceCloseConnections: true });
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

	test("Uploading app assets to an asset server", async () => {
		const l = mockLogger();

		const result = await cli.publish({
			logger: l.logger,
			cwd,
			server: address,
			name: "my-app",
			debug: true,
			token,
			version: "1.0.0",
			files: {
				"index.js": join(__dirname, "./fixtures/client.js"),
				"index.css": join(__dirname, "./fixtures/styles.css"),
			},
		});

		assert.strictEqual(
			result.type,
			"pkg",
			"Command should return correct type",
		);
		assert.strictEqual(
			result.name,
			"my-app",
			"Command should return correct name",
		);
		assert.strictEqual(
			result.version,
			"1.0.0",
			"Command should return correct version",
		);
		assert.strictEqual(
			result.files.length,
			3,
			"Command should return files array",
		);
		assert.ok(l.logs.debug.includes("Running package command"));
		assert.ok(l.logs.debug.includes("Uploading zip file to server"));
		assert.ok(l.logs.debug.includes("Cleaning up"));
	});

	test("Uploading app assets to an asset server under npm namespace", async () => {
		const l = mockLogger();

		const result = await cli.publish({
			logger: l.logger,
			cwd,
			server: address,
			name: "my-app",
			files: {
				"index.js": join(__dirname, "./fixtures/client.js"),
				"index.css": join(__dirname, "./fixtures/styles.css"),
			},
			type: "npm",
			debug: true,
			token,
			version: "1.0.0",
		});

		assert.strictEqual(
			result.type,
			"npm",
			"Command should return correct type",
		);
		assert.strictEqual(
			result.name,
			"my-app",
			"Command should return correct name",
		);
		assert.strictEqual(
			result.version,
			"1.0.0",
			"Command should return correct version",
		);
		assert.strictEqual(
			result.files.length,
			3,
			"Command should return files array",
		);
		assert.ok(l.logs.debug.includes("Running package command"));
		assert.ok(l.logs.debug.includes("Uploading zip file to server"));
		assert.ok(l.logs.debug.includes("Cleaning up"));
	});

	test("Uploading app assets to an asset server under image namespace", async () => {
		const l = mockLogger();

		const result = await cli.publish({
			logger: l.logger,
			cwd,
			server: address,
			name: "my-app",
			debug: true,
			type: "image",
			token,
			version: "1.0.0",
			files: {
				"index.js": join(__dirname, "./fixtures/client.js"),
				"index.css": join(__dirname, "./fixtures/styles.css"),
			},
		});

		assert.strictEqual(
			result.type,
			"img",
			"Command should return correct type",
		);
		assert.strictEqual(
			result.name,
			"my-app",
			"Command should return correct name",
		);
		assert.strictEqual(
			result.version,
			"1.0.0",
			"Command should return correct version",
		);
		assert.strictEqual(
			result.files.length,
			3,
			"Command should return files array",
		);
		assert.ok(l.logs.debug.includes("Running package command"));
		assert.ok(l.logs.debug.includes("Uploading zip file to server"));
		assert.ok(l.logs.debug.includes("Cleaning up"));
	});

	test("Uploading JS app assets only to an asset server", async () => {
		const l = mockLogger();

		const result = await cli.publish({
			logger: l.logger,
			cwd,
			server: address,
			name: "my-app",
			files: {
				"index.js": join(__dirname, "./fixtures/client.js"),
			},
			debug: true,
			token,
			version: "1.0.0",
		});

		assert.strictEqual(
			result.type,
			"pkg",
			"Command should return correct type",
		);
		assert.strictEqual(
			result.name,
			"my-app",
			"Command should return correct name",
		);
		assert.strictEqual(
			result.version,
			"1.0.0",
			"Command should return correct version",
		);
		assert.strictEqual(
			result.files.length,
			2,
			"Command should return files array",
		);
		assert.ok(l.logs.debug.includes("Running package command"));
		assert.ok(l.logs.debug.includes("Uploading zip file to server"));
		assert.ok(l.logs.debug.includes("Cleaning up"));
	});

	test("Uploading CSS app assets only to an asset server", async () => {
		const l = mockLogger();

		const result = await cli.publish({
			logger: l.logger,
			cwd,
			server: address,
			name: "my-app",
			files: {
				"index.css": join(__dirname, "./fixtures/styles.css"),
			},
			debug: true,
			token,
			version: "1.0.0",
		});

		assert.strictEqual(
			result.type,
			"pkg",
			"Command should return correct type",
		);
		assert.strictEqual(
			result.name,
			"my-app",
			"Command should return correct name",
		);
		assert.strictEqual(
			result.version,
			"1.0.0",
			"Command should return correct version",
		);
		assert.strictEqual(
			result.files.length,
			2,
			"Command should return files array",
		);
		assert.ok(l.logs.debug.includes("Running package command"));
		assert.ok(l.logs.debug.includes("Uploading zip file to server"));
		assert.ok(l.logs.debug.includes("Cleaning up"));
	});

	test("Uploading a directory of assets to an asset server", async () => {
		const l = mockLogger();

		const result = await cli.publish({
			logger: l.logger,
			cwd,
			server: address,
			name: "my-app",
			files: {
				icons: join(__dirname, "./fixtures/icons/**/*"),
			},
			debug: true,
			token,
			version: "1.0.0",
		});

		assert.strictEqual(
			result.type,
			"pkg",
			"Command should return correct type",
		);
		assert.strictEqual(
			result.name,
			"my-app",
			"Command should return correct name",
		);
		assert.strictEqual(
			result.version,
			"1.0.0",
			"Command should return correct version",
		);
		assert.strictEqual(
			result.files.length,
			7,
			"Command should return files array",
		);
		assert.ok(l.logs.debug.includes("Running package command"));
		assert.ok(l.logs.debug.includes("Uploading zip file to server"));
		assert.ok(l.logs.debug.includes("Cleaning up"));
	});

	test("Uploading a directory of assets to the root path to an asset server 2", async () => {
		const l = mockLogger();

		const result = await cli.publish({
			logger: l.logger,
			cwd,
			server: address,
			name: "my-app",
			files: join(__dirname, "./fixtures/icons/**/*"),
			debug: true,
			token,
			version: "1.0.0",
		});

		assert.strictEqual(
			result.type,
			"pkg",
			"Command should return correct type",
		);
		assert.strictEqual(
			result.name,
			"my-app",
			"Command should return correct name",
		);
		assert.strictEqual(
			result.version,
			"1.0.0",
			"Command should return correct version",
		);
		assert.strictEqual(
			result.files.length,
			7,
			"Command should return files array",
		);
		assert.ok(l.logs.debug.includes("Running package command"));
		assert.ok(l.logs.debug.includes("Uploading zip file to server"));
		assert.ok(l.logs.debug.includes("Cleaning up"));
	});
});
