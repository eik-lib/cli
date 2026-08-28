/**
 * Tests that verify retry behaviour of HTTP utilities against transient 5xx errors.
 *
 * integrity.js — tested against a real Eik server: the first call returns a mocked
 * 503, the retry goes to the real server and gets a real integrity response.
 *
 * request.js — tested with mocked fetch only: the upload format (tar archive,
 * multipart content-type) makes real-server testing complex and adds no value
 * for verifying the retry mechanism itself.
 */
import fastify from "fastify";
import { promises as fs } from "fs";
import os from "os";
import { join, basename } from "path";
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "url";
import { dirname } from "path";
import EikService from "@eik/service";
import Sink from "@eik/sink-memory";
import cli from "../classes/index.js";
import integrity from "../utils/http/integrity.js";
import request from "../utils/http/request.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("integrity — retry on transient 5xx", () => {
	let server;
	let address;
	let token;
	let cwd;

	beforeEach(async () => {
		const memSink = new Sink();
		server = fastify({ logger: false, forceCloseConnections: true });
		const service = new EikService({ customSink: memSink });
		server.register(service.api());
		address = await server.listen({ host: "127.0.0.1", port: 0 });
		token = await cli.login({ server: address, key: "change_me" });
		cwd = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));

		await cli.publish({
			cwd,
			server: address,
			name: "my-app",
			token,
			version: "1.0.0",
			files: { "index.js": join(__dirname, "./fixtures/client.js") },
		});
	});

	afterEach(async () => {
		await server.close();
		await fs.rm(cwd, { recursive: true, force: true });
	});

	test("retries on 503 and returns the integrity from the real server", async (t) => {
		const originalFetch = globalThis.fetch;
		let call = 0;
		t.mock.method(globalThis, "fetch", async (url, opts) => {
			call++;
			if (call === 1)
				return new Response("Service Unavailable", {
					status: 503,
					statusText: "Service Unavailable",
				});
			return originalFetch(url, opts);
		});

		const result = await integrity(address, "pkg", "my-app", "1.0.0");
		assert.ok(result, "should return an integrity hash");
		assert.ok(
			result.startsWith("sha512-"),
			"integrity should be a sha512 hash",
		);
		assert.equal(call, 2, "should have retried once after the 503");
	});

	test("does not retry on 404 — returns null immediately", async (t) => {
		const originalFetch = globalThis.fetch;
		let call = 0;
		t.mock.method(globalThis, "fetch", async (url, opts) => {
			call++;
			return originalFetch(url, opts);
		});

		const result = await integrity(address, "pkg", "does-not-exist", "1.0.0");
		assert.equal(result, null, "should return null for a missing package");
		assert.equal(call, 1, "should not retry on 404");
	});
});

describe("request — retry on transient 5xx (mock-based)", () => {
	test("retries on 503 and returns the result from the successful attempt", async (t) => {
		let call = 0;
		t.mock.method(globalThis, "fetch", async () => {
			call++;
			if (call === 1)
				return new Response("Service Unavailable", {
					status: 503,
					statusText: "Service Unavailable",
				});
			return new Response(JSON.stringify({ message: "ok" }), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		});

		const result = await request({
			host: "http://eik.example",
			pathname: "/pkg/my-app/1.0.0",
			method: "PUT",
		});
		assert.equal(result.status, 200);
		assert.equal(call, 2, "should have retried once after the 503");
	});

	test("does not retry on 4xx client errors", async (t) => {
		let call = 0;
		t.mock.method(globalThis, "fetch", async () => {
			call++;
			return new Response("Bad Request", {
				status: 400,
				statusText: "Bad Request",
			});
		});

		await assert.rejects(
			() =>
				request({
					host: "http://eik.example",
					pathname: "/pkg/my-app/1.0.0",
					method: "PUT",
				}),
			(err) => {
				assert.ok(/** @type {any} */ (err).message.includes("400"));
				return true;
			},
		);
		assert.equal(call, 1, "should not retry on 4xx");
	});
});
