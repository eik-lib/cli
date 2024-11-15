import fastify from "fastify";
import { promises as fs } from "fs";
import os from "os";
import { join, basename } from "path";
import { mockLogger } from "./utils.mjs";
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
	const server = fastify();
	const service = new EikService({ customSink: memSink });
	await server.register(service.api());
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

test("Uploading import map to an asset server", async (t) => {
	const { address, token, cwd } = t.context;
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

	t.same(
		result,
		{
			name: "my-map",
			version: "1.0.0",
			server: address,
			type: "map",
		},
		"Command should return an object",
	);
	t.match(
		l.logs.debug,
		'Uploading import map "my-map" version "1.0.0" to asset server',
		"Log output should show published name, version and org",
	);
});
