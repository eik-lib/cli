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

describe("publish map", () => {
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

	test("Uploading import map to an asset server", async () => {
		const l = mockLogger();

		const result = await cli.map({
			logger: l.logger,
			cwd,
			server: address,
			name: "my-map",
			version: "1.0.0",
			file: join(__dirname, "./fixtures/import-map.json"),
			debug: true,
			token,
		});

		assert.deepStrictEqual(
			result,
			{
				name: "my-map",
				version: "1.0.0",
				server: address,
				type: "map",
			},
			"Command should return an object",
		);
		assert.ok(
			l.logs.debug.includes(
				'Uploading import map "my-map" version "1.0.0" to asset server',
			),
			"Log output should show published name, version and org",
		);
	});
});
