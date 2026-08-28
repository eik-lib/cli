import { test, describe, mock } from "node:test";
import assert from "node:assert/strict";
import { fetchWithRetry } from "../utils/http/retry.js";

describe("fetchWithRetry", () => {
	test("returns the response immediately when the first call succeeds", async () => {
		const fn = mock.fn(async () => new Response("{}", { status: 200 }));
		const res = await fetchWithRetry(fn);
		assert.equal(res.status, 200);
		assert.equal(fn.mock.calls.length, 1, "should only call once");
	});

	test("retries on 5xx and succeeds on a subsequent attempt", async () => {
		let call = 0;
		const fn = mock.fn(async () => {
			call++;
			if (call < 3) return new Response("error", { status: 503 });
			return new Response("{}", { status: 200 });
		});

		const res = await fetchWithRetry(fn, { maxRetries: 3, baseDelayMs: 0 });
		assert.equal(res.status, 200);
		assert.equal(fn.mock.calls.length, 3, "should retry until success");
	});

	test("throws after exhausting all retries on persistent 5xx", async () => {
		const fn = mock.fn(async () => new Response("error", { status: 503 }));

		const res = await fetchWithRetry(fn, { maxRetries: 3, baseDelayMs: 0 });
		assert.equal(
			res.status,
			503,
			"should return last 503 after retries exhausted",
		);
		assert.equal(fn.mock.calls.length, 3, "should have tried maxRetries times");
	});

	test("does not retry on 404 — returns immediately", async () => {
		const fn = mock.fn(async () => new Response("not found", { status: 404 }));

		const res = await fetchWithRetry(fn, { maxRetries: 3, baseDelayMs: 0 });
		assert.equal(res.status, 404);
		assert.equal(fn.mock.calls.length, 1, "should not retry on 404");
	});

	test("does not retry on 4xx client errors", async () => {
		const fn = mock.fn(
			async () => new Response("bad request", { status: 400 }),
		);

		const res = await fetchWithRetry(fn, { maxRetries: 3, baseDelayMs: 0 });
		assert.equal(res.status, 400);
		assert.equal(fn.mock.calls.length, 1, "should not retry on 4xx");
	});

	test("retries on network-level errors (fetch throws)", async () => {
		let call = 0;
		const fn = mock.fn(async () => {
			call++;
			if (call < 3) throw new Error("ECONNRESET");
			return new Response("{}", { status: 200 });
		});

		const res = await fetchWithRetry(fn, { maxRetries: 3, baseDelayMs: 0 });
		assert.equal(res.status, 200);
		assert.equal(fn.mock.calls.length, 3);
	});

	test("throws network error after exhausting retries", async () => {
		const fn = mock.fn(async () => {
			throw new Error("ECONNRESET");
		});

		await assert.rejects(
			() => fetchWithRetry(fn, { maxRetries: 3, baseDelayMs: 0 }),
			{ message: "ECONNRESET" },
		);
		assert.equal(fn.mock.calls.length, 3);
	});
});
