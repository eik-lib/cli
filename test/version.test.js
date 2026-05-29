import fastify from "fastify";
import { promises as fs } from "fs";
import os from "os";
import { join, basename } from "path";
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import EikService from "@eik/service";
import Sink from "@eik/sink-memory";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cli from "../classes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("version", () => {
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

	test("Current version unpublished - rejects with error", async () => {
		try {
			await cli.version({
				cwd,
				server: address,
				name: "my-app",
				files: {
					"index.js": join(__dirname, "./fixtures/client.js"),
					"index.css": join(__dirname, "./fixtures/styles.css"),
				},
				version: "1.0.0",
			});
		} catch (err) {
			const e = /** @type {Error} */ (err);
			assert.strictEqual(
				e.message,
				"The current version of this package has not yet been published, version change is not needed.",
			);
		}
	});

	test("Current version published - files the same - rejects with error", async () => {
		const config = {
			cwd,
			server: address,
			name: "my-app",
			files: {
				"index.js": join(__dirname, "./fixtures/client.js"),
				"index.css": join(__dirname, "./fixtures/styles.css"),
			},
			token,
			version: "1.0.0",
		};

		await cli.publish(config);

		try {
			await cli.version(config);
		} catch (err) {
			const e = /** @type {Error} */ (err);
			assert.strictEqual(
				e.message,
				"The current version of this package already contains these files, version change is not needed.",
			);
		}
	});

	test("Current version published - files changed - bumps version", async () => {
		const config = {
			cwd,
			server: address,
			name: "my-app",
			files: {
				"index.js": join(__dirname, "./fixtures/client.js"),
				"index.css": join(__dirname, "./fixtures/styles.css"),
			},
			token,
			version: "1.0.0",
		};

		await cli.publish(config);

		const newVersion = await cli.version({
			...config,
			files: { "index.js": join(__dirname, "./fixtures/client.js") },
		});

		assert.strictEqual(newVersion, "1.0.1");
	});
});
