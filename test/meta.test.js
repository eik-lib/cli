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

describe("meta", () => {
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

	test("Retrieving meta information about a package from an asset server", async () => {
		const l = mockLogger();

		await cli.publish({
			server: address,
			name: "lit-html",
			version: "1.1.2",
			token,
			type: "npm",
			cwd,
			files: {
				"index.js": join(__dirname, "./fixtures/client.js"),
				"index.css": join(__dirname, "./fixtures/styles.css"),
			},
		});

		const result = /** @type {any} */ (
			await cli.meta({
				logger: l.logger,
				server: address,
				name: "lit-html",
			})
		);

		assert.ok(result, "Command should return truthy");
		assert.ok(result.npm, "Command should be npm scoped");
		assert.strictEqual(
			result.npm.name,
			"lit-html",
			"Log output should show package name",
		);
		assert.strictEqual(
			result.npm.versions[0].version,
			"1.1.2",
			"Log output should show package version",
		);
	});
});
