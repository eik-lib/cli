import fastify from "fastify";
import { promises as fs } from "fs";
import os from "os";
import { join, basename } from "path";
import { test, beforeEach, afterEach } from "tap";
import EikService from "@eik/service";
import Sink from "@eik/sink-memory";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cli from "../classes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

beforeEach(async (t) => {
	const memSink = new Sink();
	const server = fastify({ logger: false });
	const service = new EikService({ customSink: memSink });
	server.register(service.api());
	const address = await server.listen({
		host: "127.0.0.1",
		port: 0,
	});

	const token = await cli.login({
		server: address,
		key: "change_me",
	});

	const cwd = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));

	t.context.server = server;
	t.context.address = address;
	t.context.token = token;
	t.context.cwd = cwd;
});

afterEach(async (t) => {
	await t.context.server.close();
});

test("Current version unpublished - rejects with error", async (t) => {
	const { address, cwd } = t.context;

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
		t.equal(
			err.message,
			"The current version of this package has not yet been published, version change is not needed.",
		);
	}
});

test("Current version published - files the same - rejects with error", async (t) => {
	const { address, token, cwd } = t.context;
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
		t.equal(
			err.message,
			"The current version of this package already contains these files, version change is not needed.",
		);
	}
});

test("Current version published - files changed - bumps version", async (t) => {
	const { address, token, cwd } = t.context;
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

	t.equal(newVersion, "1.0.1");
});
