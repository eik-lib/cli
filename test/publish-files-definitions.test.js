import fastify from "fastify";
import { cpSync } from "node:fs";
import fs from "node:fs/promises";
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

const config = (files, server, token, cwd) => ({
	logger: null,
	cwd,
	server,
	name: "my-app",
	files,
	debug: true,
	token,
	version: "1.0.0",
});

describe("publish files definitions", () => {
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
		cpSync(join(__dirname, "./fixtures"), join(cwd, "fixtures"), {
			recursive: true,
		});
	});

	afterEach(async () => {
		await server.close();
	});

	test("when a folder of files is specified as a string", async () => {
		const pattern = "fixtures/icons";
		// @ts-expect-error
		const { files } = await cli.publish(config(pattern, address, token, cwd));

		assert.strictEqual(
			files[0].pathname,
			"/eik.json",
			"eik.json file should be at package root",
		);
		assert.ok(
			files.some((f) => f.pathname === "/checkbox-sprite-nontouch.svg"),
			"files should be packaged at package root",
		);
	});

	test("when a folder of files is specified as a string prefixed by ./", async () => {
		const pattern = "./fixtures/icons";
		// @ts-expect-error
		const { files } = await cli.publish(config(pattern, address, token, cwd));

		assert.ok(
			files.some((f) => f.pathname === "/checkbox-sprite-nontouch.svg"),
			"files should be packaged at package root",
		);
	});

	test("when a folder of files is specified as a string postfixed by /", async () => {
		const pattern = "./fixtures/icons/";
		// @ts-expect-error
		const { files } = await cli.publish(config(pattern, address, token, cwd));

		assert.ok(
			files.some((f) => f.pathname === "/checkbox-sprite-nontouch.svg"),
			"files should be packaged at package root",
		);
	});

	test("when a folder of files is specified with a nested folder mapping", async () => {
		const patter = { "path/to/folder": "./fixtures/icons/" };
		// @ts-expect-error
		const { files } = await cli.publish(config(patter, address, token, cwd));

		assert.ok(
			files.some(
				(f) => f.pathname === "/path/to/folder/checkbox-sprite-nontouch.svg",
			),
			"files should be packaged at path/to/folder",
		);
	});

	test("when a folder of files is specified with a nested folder mapping prefixed by ./", async () => {
		const pattern = { "./path/to/folder": "./fixtures/icons/" };
		// @ts-expect-error
		const { files } = await cli.publish(config(pattern, address, token, cwd));

		assert.ok(
			files.some(
				(f) => f.pathname === "/path/to/folder/checkbox-sprite-nontouch.svg",
			),
			"files should be packaged at path/to/folder",
		);
	});

	test("when a folder of files is specified with a nested folder mapping prefixed by /", async () => {
		const pattern = { "/path/to/folder": "./fixtures/icons/" };
		// @ts-expect-error
		const { files } = await cli.publish(config(pattern, address, token, cwd));

		assert.ok(
			files.some(
				(f) => f.pathname === "/path/to/folder/checkbox-sprite-nontouch.svg",
			),
			"files should be packaged at path/to/folder",
		);
	});

	test("when a folder of files is specified with a nested folder mapping post fixed with /", async () => {
		const patter = { "path/to/folder/": "./fixtures/icons/" };
		// @ts-expect-error
		const { files } = await cli.publish(config(patter, address, token, cwd));

		assert.ok(
			files.some(
				(f) => f.pathname === "/path/to/folder/checkbox-sprite-nontouch.svg",
			),
			"files should be packaged at path/to/folder",
		);
	});

	test("when a folder of files is specified as an absolute path string", async () => {
		const pattern = join(__dirname, "./fixtures/icons");
		// @ts-expect-error
		const { files } = await cli.publish(config(pattern, address, token, cwd));

		assert.strictEqual(
			files[0].pathname,
			"/eik.json",
			"eik.json file should be at package root",
		);
		assert.ok(
			files.some((f) => f.pathname === "/checkbox-sprite-nontouch.svg"),
			"files should be packaged at package root",
		);
	});

	test("when a folder of files is specified as an object", async () => {
		const pattern = {
			"/icons": "./fixtures/icons",
		};
		// @ts-expect-error
		const { files } = await cli.publish(config(pattern, address, token, cwd));

		assert.ok(
			files.some((f) => f.pathname === "/icons/checkbox-sprite-nontouch.svg"),
			"files should be packaged under /icons",
		);
	});

	test("when a folder of files is specified as an object with absolute path", async () => {
		const pattern = {
			"/icons": join(__dirname, "./fixtures/icons"),
		};
		// @ts-expect-error
		const { files } = await cli.publish(config(pattern, address, token, cwd));

		assert.ok(
			files.some((f) => f.pathname === "/icons/checkbox-sprite-nontouch.svg"),
			"files should be packaged under /icons",
		);
	});

	test("when 2 specific file name entries are specified", async () => {
		const pattern = {
			"/esm.js": "./fixtures/client.js",
			"/esm.css": "./fixtures/styles.css",
		};
		// @ts-expect-error
		const { files } = await cli.publish(config(pattern, address, token, cwd));

		assert.strictEqual(
			files[1].pathname,
			"/esm.js",
			"client.js should be mapped to esm.js",
		);
		assert.strictEqual(
			files[2].pathname,
			"/esm.css",
			"styles.js should be mapped to esm.css",
		);
	});

	test("when 2 specific file name entries are specified with absolute paths", async () => {
		const pattern = {
			"/esm.js": join(__dirname, "./fixtures/client.js"),
			"/esm.css": join(__dirname, "./fixtures/styles.css"),
		};
		// @ts-expect-error
		const { files } = await cli.publish(config(pattern, address, token, cwd));

		assert.strictEqual(
			files[1].pathname,
			"/esm.js",
			"client.js should be mapped to esm.js",
		);
		assert.strictEqual(
			files[2].pathname,
			"/esm.css",
			"styles.js should be mapped to esm.css",
		);
	});

	test("when a recursive glob is specified", async () => {
		const pattern = "fixtures/**/*";
		// @ts-expect-error
		const { files } = await cli.publish(config(pattern, address, token, cwd));

		assert.ok(
			files.some((f) => f.pathname === "/client.js"),
			"client.js should be packaged at /",
		);
		assert.ok(
			files.some((f) => f.pathname === "/icons/checkboxes.svg"),
			"svgs should be packaged under /icons",
		);
	});

	test("when a non recursive glob is specified", async () => {
		const pattern = "fixtures/*";
		// @ts-expect-error
		const { files } = await cli.publish(config(pattern, address, token, cwd));

		const nested = files.filter((file) => file.pathname.includes("icons"));

		assert.ok(
			files.some((f) => f.pathname === "/client.js"),
			"client.js should be packaged at /",
		);
		assert.strictEqual(nested.length, 0, "no nested files should be present");
	});

	test("when a file is specified with a leading path", async () => {
		const pattern = "fixtures/client.js";
		// @ts-expect-error
		const { files } = await cli.publish(config(pattern, address, token, cwd));

		assert.strictEqual(
			files[1].pathname,
			"/client.js",
			"the file should be packaged at /",
		);
	});

	test("when a file is specified as an object and mapped with a leading path", async () => {
		const pattern = { "path/to/esm.js": "fixtures/client.js" };
		// @ts-expect-error
		const { files } = await cli.publish(config(pattern, address, token, cwd));

		assert.strictEqual(
			files[1].pathname,
			"/path/to/esm.js",
			"the file should be packaged with the leading path and the mapping",
		);
	});
});
