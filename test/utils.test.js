import fastify from "fastify";
import { promises as fs } from "fs";
import os from "os";
import { join, basename } from "path";
import { test } from "node:test";
import assert from "node:assert";
import { fileURLToPath } from "url";
import { dirname } from "path";
import crypto from "crypto";
import read from "../utils/json/read.js";
import write from "../utils/json/write.js";
import file from "../utils/hash/file.js";
import files from "../utils/hash/files.js";
import compare from "../utils/hash/compare.js";
import latestVersion from "../utils/http/latest-version.js";
import integrity from "../utils/http/integrity.js";
import { getArgsOrDefaults } from "../utils/defaults.js";

const j = {
	write,
	read,
};

const h = {
	file,
	files,
	compare,
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test("calculate file hash", async () => {
	const hash = await h.file(join(__dirname, "fixtures", "client.js"));
	assert.strictEqual(
		hash,
		"sha512-AzZUEv6TzJOlb7MOJSkAtFDihZnjCqOjgWqQmRlQj+/9CsWGQKGJzOT1CPp2R9PQlA0dd3B1+xrrgLsDX9OFtQ==",
		"returned hash should match",
	);
});

test("calculate files hash", async () => {
	const hash = await h.files([
		join(__dirname, "fixtures", "styles.css"),
		join(__dirname, "fixtures", "client.js"),
		join(__dirname, "fixtures", "import-map.json"),
	]);

	const fileHash1 = await h.file(join(__dirname, "fixtures", "client.js"));
	const fileHash2 = await h.file(
		join(__dirname, "fixtures", "import-map.json"),
	);
	const fileHash3 = await h.file(join(__dirname, "fixtures", "styles.css"));

	const hasher = crypto.createHash("sha512");
	hasher.update(fileHash1);
	hasher.update(fileHash2);
	hasher.update(fileHash3);

	assert.strictEqual(
		hash,
		`sha512-${hasher.digest("base64")}`,
		"returned hash should match",
	);
});

test("compare hashes - true", async () => {
	const fileHash1 = await h.file(join(__dirname, "fixtures", "client.js"));
	const fileHash2 = await h.file(join(__dirname, "fixtures", "client.js"));

	assert.strictEqual(
		h.compare(fileHash1, fileHash2),
		true,
		"hashes compared should produce a true result",
	);
});

test("compare hashes - false", async () => {
	const fileHash1 = await h.file(join(__dirname, "fixtures", "client.js"));
	const fileHash2 = await h.file(
		join(__dirname, "fixtures", "import-map.json"),
	);

	assert.strictEqual(
		h.compare(fileHash1, fileHash2),
		false,
		"hashes compared should produce a false result",
	);
});

test("fetch latest version for a given published bundle", async () => {
	const server = fastify();
	server.get("/pkg/foo", async () => ({
		versions: [
			[1, { version: "1.3.2" }],
			[2, { version: "2.1.8" }],
		],
	}));
	const address = await server.listen({
		host: "127.0.0.1",
		port: 0,
	});

	const version = await latestVersion(address, "pkg", "foo");

	assert.strictEqual(version, "2.1.8", "Version should match expected value");

	await server.close();
});

test("fetch latest version, filtered by major, for a given published bundle", async () => {
	const server = fastify();
	server.get("/pkg/foo", async () => ({
		versions: [
			[1, { version: "1.3.2" }],
			[2, { version: "2.1.8" }],
		],
	}));
	const address = await server.listen({
		host: "127.0.0.1",
		port: 0,
	});

	const version = await latestVersion(address, "pkg", "foo", 1);

	assert.strictEqual(version, "1.3.2", "Version should match expected value");

	await server.close();
});

test("fetch latest version for a given published bundle, non existant bundle on server", async () => {
	const server = fastify();
	const address = await server.listen({
		host: "127.0.0.1",
		port: 0,
	});

	try {
		await latestVersion(address, "pkg", "foo");
	} catch (err) {
		assert.strictEqual(
			err.message,
			"Server responded with non 200 status code.",
			"Error message should indicate a server failure",
		);
	}

	await server.close();
});

test("fetch latest version, invalid JSON response from server", async () => {
	const server = fastify();
	server.get("/pkg/foo", async () => "");
	const address = await server.listen({
		host: "127.0.0.1",
		port: 0,
	});

	try {
		await latestVersion(address, "pkg", "foo");
	} catch (err) {
		assert.strictEqual(
			err.message,
			"An error occurred while attempting to parse json response from server.",
			"Error message should indicate a JSON parsing issue",
		);
	}

	await server.close();
});

test("fetch latest version, invalid versions returned by server", async () => {
	const server = fastify();
	server.get("/pkg/foo", async () => ({ versions: 1 }));
	const address = await server.listen({
		host: "127.0.0.1",
		port: 0,
	});

	await assert.rejects(
		latestVersion(address, "pkg", "foo"),
		"should throw when server responds with invalid version object",
	);

	await server.close();
});

test("fetch latest version, invalid versions keys returned by server", async () => {
	const server = fastify();
	server.get("/pkg/foo", async () => ({
		versions: [
			["not a number", 1],
			["also not a number", 2],
		],
	}));
	const address = await server.listen({
		host: "127.0.0.1",
		port: 0,
	});

	await assert.rejects(
		latestVersion(address, "pkg", "foo"),
		"should throw when server responds with invalid version keys",
	);

	await server.close();
});

test("fetch latest version, no bundles yet published", async () => {
	const server = fastify();
	server.get("/pkg/foo", async () => ({
		latest: {},
		versions: [],
	}));
	const address = await server.listen({
		host: "127.0.0.1",
		port: 0,
	});

	const version = await latestVersion(address, "pkg", "foo");

	assert.strictEqual(version, null, "Version should be null");

	await server.close();
});

test("fetch remote hash for a given version", async () => {
	const server = fastify();
	server.get("/pkg/foo/1.0.0", async () => ({
		integrity:
			"sha512-36Ug1lJ/p/H0n5+or1HDLrqLaI3nvB7j2f7PC9RIzWd3T5GE4CfOuClEZRiNsf/F4BjT5FnS9mz0EzeDHpu3uw==",
		files: [
			{
				integrity:
					"sha512-T2qS6EBvOIu10bhUas3FhD39KkwIiXxplJ13q2EdXcA7nlYljlLKaymKhqz49f7qrEKhdISc4q5N+bk0Y1Y/NA==",
			},
			{
				integrity:
					"sha512-0K6U6pmI04xIBGE+KgfSRNMY0gBmKAwjWzZ+DM/tkicZSG+Uz5erTFw1Zru/0wXUPs256glMX24n0f1Q4z62tw==",
			},
		],
	}));
	const address = await server.listen({
		host: "127.0.0.1",
		port: 0,
	});
	const result = await integrity(address, "pkg", "foo", "1.0.0");

	assert.strictEqual(
		result,
		"sha512-36Ug1lJ/p/H0n5+or1HDLrqLaI3nvB7j2f7PC9RIzWd3T5GE4CfOuClEZRiNsf/F4BjT5FnS9mz0EzeDHpu3uw==",
		"should return correct hash",
	);
	await server.close();
});

test("write JSON file - object - file relative to cwd", async () => {
	const cwd = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));
	await j.write(
		{ version: "1.0.0", integrity: [] },
		{ cwd, filename: ".eikrc" },
	);
	const eikrc = await fs.readFile(join(cwd, ".eikrc"));
	const { version, integrity } = JSON.parse(eikrc);

	assert.strictEqual(version, "1.0.0", "Version should be 1.0.0");
	assert.deepStrictEqual(integrity, [], "Integrity should be an array");
});

test("write JSON file - object - file absolute path", async () => {
	const cwd = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));
	await j.write({ prop: "val" }, { filename: join(cwd, "test.json") });
	const eikrc = await fs.readFile(join(cwd, "test.json"), {
		encoding: "utf8",
	});
	const { prop } = JSON.parse(eikrc);

	assert.strictEqual(prop, "val", "Prop should equal val");
});

test("write JSON file - string - file relative path", async () => {
	await j.write({ prop: "val" }, "./test-using-relative.json");
	const eikrc = await fs.readFile(
		join(__dirname, "../test-using-relative.json"),
		{ encoding: "utf8" },
	);
	const { prop } = JSON.parse(eikrc);
	await fs.unlink(join(__dirname, "../test-using-relative.json"));

	assert.strictEqual(prop, "val", "Prop should equal val");
});

test("write JSON file - string - file absolute path", async () => {
	const cwd = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));
	await j.write({ prop: "val" }, join(cwd, "test3.json"));
	const eikrc = await fs.readFile(join(cwd, "test3.json"), {
		encoding: "utf8",
	});
	const { prop } = JSON.parse(eikrc);

	assert.strictEqual(prop, "val", "Prop should equal val");
});

test("read JSON file - object - file relative path", async () => {
	const cwd = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));
	await fs.writeFile(join(cwd, "test3.json"), JSON.stringify({ key: "val" }));
	const json = await j.read({ cwd, filename: "./test3.json" });

	assert.strictEqual(json.key, "val", "Key should equal val");
});

test("read JSON file - object - file absolute path", async () => {
	const cwd = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));
	await fs.writeFile(join(cwd, "test3.json"), JSON.stringify({ key: "val" }));
	const json = await j.read({ filename: join(cwd, "./test3.json") });

	assert.strictEqual(json.key, "val", "Key should equal val");
});

test("read JSON file - string - file relative path", async () => {
	await fs.writeFile(
		join(__dirname, "../test-read-json.json"),
		JSON.stringify({ key: "val" }),
	);
	const json = await j.read("./test-read-json.json");

	assert.strictEqual(json.key, "val", "Key should equal val");
});

test("read JSON file - string - file absolute path", async () => {
	const cwd = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));
	await fs.writeFile(
		join(cwd, "./test-read-json-2.json"),
		JSON.stringify({ key: "val" }),
	);
	const json = await j.read(join(cwd, "./test-read-json-2.json"));

	assert.strictEqual(json.key, "val", "Key should equal val");
});

test("getArgsOrDefaults - file absolute path", async () => {
	const cwd = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));
	await fs.writeFile(
		join(cwd, "./eik.json"),
		JSON.stringify({
			name: "magestic-muffin",
			version: "1.33.7",
			server: "https://myserver.com",
			files: "./public",
		}),
	);
	const defaults = getArgsOrDefaults(
		{
			cwd,
			config: join(cwd, "./eik.json"),
		},
		{ command: "publish", options: [] },
	);

	assert.strictEqual(
		defaults.name,
		"magestic-muffin",
		"eik.json name property should have been read from given absolute config path",
	);
});

test("getArgsOrDefaults - file relative path", async () => {
	const cwd = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));
	await fs.writeFile(
		join(cwd, "./eik.json"),
		JSON.stringify({
			name: "magestic-muffin",
			version: "1.33.7",
			server: "https://myserver.com",
			files: "./public",
		}),
	);
	const defaults = getArgsOrDefaults(
		{
			cwd,
			config: "./eik.json",
		},
		{ command: "publish", options: [] },
	);

	assert.strictEqual(
		defaults.name,
		"magestic-muffin",
		"eik.json name property should have been read from given relative config path",
	);
});
