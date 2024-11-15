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
	t.context.server = server;
	t.context.address = address;
});

afterEach(async (t) => {
	await t.context.server.close();
});

test("Logging in to an asset server", async (t) => {
	const { address } = t.context;
	const l = mockLogger();

	const token = await cli.login({
		server: address,
		key: "change_me",
		logger: l.logger,
	});

	t.equal(token.length, 187, "Command should return a token");
	t.equal(l.logs.info, "Login successful", "Logs should indicate success");
});

test("Logging in to an asset server", async (t) => {
	const { address } = t.context;
	const l = mockLogger();

	const result = await cli.login({
		server: address,
		key: "incorrectkey",
		logger: l.logger,
	});

	t.equal(result, false, "Command should return false on failure");
	t.equal(
		l.logs.info,
		"Login unsuccessful. Invalid credentials.",
		"Logs should indicate failure",
	);
});
