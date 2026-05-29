import fastify from "fastify";
import { mockLogger } from "./utils.js";
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import EikService from "@eik/service";
import Sink from "@eik/sink-memory";
import cli from "../classes/index.js";

describe("login", () => {
	let server;
	let address;

	beforeEach(async () => {
		const memSink = new Sink();
		server = fastify({ logger: false, forceCloseConnections: true });
		const service = new EikService({ customSink: memSink });
		server.register(service.api());
		address = await server.listen({
			host: "127.0.0.1",
			port: 0,
		});
	});

	afterEach(async () => {
		await server.close();
	});

	test("Logging in to an asset server", async () => {
		const l = mockLogger();

		const token = await cli.login({
			server: address,
			key: "change_me",
			logger: l.logger,
		});

		assert.ok(
			typeof token === "string" && token.length === 187,
			"Command should return a token",
		);
		assert.strictEqual(
			l.logs.info,
			"Login successful",
			"Logs should indicate success",
		);
	});

	test("Logging in to an asset server with invalid key", async () => {
		const l = mockLogger();

		const result = await cli.login({
			server: address,
			key: "incorrectkey",
			logger: l.logger,
		});

		assert.strictEqual(result, false, "Command should return false on failure");
		assert.strictEqual(
			l.logs.info,
			"Login unsuccessful. Invalid credentials.",
			"Logs should indicate failure",
		);
	});
});
