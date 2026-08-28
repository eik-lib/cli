/**
 * Tests that verify retry behaviour of HTTP utilities against transient 5xx errors.
 * These tests fail before fetchWithRetry is wired in — the utilities currently
 * surface 503s as errors instead of retrying.
 */
import { test, describe, mock } from "node:test";
import assert from "node:assert/strict";
import integrity from "../utils/http/integrity.js";
import request from "../utils/http/request.js";

describe("integrity — retry on transient 5xx", () => {
	test("retries on 503 and returns the result from the successful attempt", async (t) => {
		let call = 0;
		t.mock.method(globalThis, "fetch", async () => {
			call++;
			if (call === 1)
				return new Response("Service Unavailable", {
					status: 503,
					statusText: "Service Unavailable",
				});
			return new Response(JSON.stringify({ integrity: "sha512-abc123" }), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		});

		const result = await integrity(
			"http://eik.example",
			"pkg",
			"my-app",
			"1.0.0",
		);
		assert.equal(result, "sha512-abc123");
		assert.equal(call, 2, "should have retried once after the 503");
	});

	test("does not retry on 404 — returns null immediately", async (t) => {
		let call = 0;
		t.mock.method(globalThis, "fetch", async () => {
			call++;
			return new Response("Not Found", {
				status: 404,
				statusText: "Not Found",
			});
		});

		const result = await integrity(
			"http://eik.example",
			"pkg",
			"my-app",
			"1.0.0",
		);
		assert.equal(result, null);
		assert.equal(call, 1, "should not retry on 404");
	});
});

describe("request — retry on transient 5xx", () => {
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
