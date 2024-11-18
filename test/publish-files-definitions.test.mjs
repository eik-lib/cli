import fastify from "fastify";
import { promises as fs } from "fs";
import os from "os";
import { join, basename } from "path";
import { test, beforeEach, afterEach } from "tap";
import EikService from "@eik/service";
import Sink from "@eik/sink-memory";
import fsExtra from "fs-extra";
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

beforeEach(async (t) => {
	const memSink = new Sink();
	const server = fastify({
		ignoreTrailingSlash: true,
		forceCloseConnections: true,
	});
	const service = new EikService({ sink: memSink });
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
	fsExtra.copySync(join(__dirname, "./fixtures"), join(cwd, "fixtures"));

	t.context.server = server;
	t.context.address = address;
	t.context.token = token;
	t.context.cwd = cwd;
});

afterEach(async (t) => {
	await t.context.server.close();
});

test("when a folder of files is specified as a string", async (t) => {
	const { address, token, cwd } = t.context;
	const pattern = "fixtures/icons";
	// @ts-expect-error
	const { files } = await cli.publish(config(pattern, address, token, cwd));

	t.equal(
		files[0].pathname,
		"/eik.json",
		"eik.json file should be at package root",
	);
	t.equal(
		files[6].pathname,
		"/checkbox-sprite-nontouch.svg",
		"files should be packaged at package root",
	);
});

test("when a folder of files is specified as a string prefixed by ./", async (t) => {
	const { address, token, cwd } = t.context;
	const pattern = "./fixtures/icons";
	// @ts-expect-error
	const { files } = await cli.publish(config(pattern, address, token, cwd));

	t.equal(
		files[6].pathname,
		"/checkbox-sprite-nontouch.svg",
		"files should be packaged at package root",
	);
});

test("when a folder of files is specified as a string postfixed by /", async (t) => {
	const { address, token, cwd } = t.context;
	const pattern = "./fixtures/icons/";
	// @ts-expect-error
	const { files } = await cli.publish(config(pattern, address, token, cwd));

	t.equal(
		files[6].pathname,
		"/checkbox-sprite-nontouch.svg",
		"files should be packaged at package root",
	);
});

test("when a folder of files is specified with a nested folder mapping", async (t) => {
	const { address, token, cwd } = t.context;
	const patter = { "path/to/folder": "./fixtures/icons/" };
	// @ts-expect-error
	const { files } = await cli.publish(config(patter, address, token, cwd));

	t.equal(
		files[6].pathname,
		"/path/to/folder/checkbox-sprite-nontouch.svg",
		"files should be packaged at path/to/folder",
	);
});

test("when a folder of files is specified with a nested folder mapping prefixed by ./", async (t) => {
	const { address, token, cwd } = t.context;
	const pattern = { "./path/to/folder": "./fixtures/icons/" };
	// @ts-expect-error
	const { files } = await cli.publish(config(pattern, address, token, cwd));

	t.equal(
		files[6].pathname,
		"/path/to/folder/checkbox-sprite-nontouch.svg",
		"files should be packaged at path/to/folder",
	);
});

test("when a folder of files is specified with a nested folder mapping prefixed by /", async (t) => {
	const { address, token, cwd } = t.context;
	const pattern = { "/path/to/folder": "./fixtures/icons/" };
	// @ts-expect-error
	const { files } = await cli.publish(config(pattern, address, token, cwd));

	t.equal(
		files[6].pathname,
		"/path/to/folder/checkbox-sprite-nontouch.svg",
		"files should be packaged at path/to/folder",
	);
});

test("when a folder of files is specified with a nested folder mapping post fixed with /", async (t) => {
	const { address, token, cwd } = t.context;
	const patter = { "path/to/folder/": "./fixtures/icons/" };
	// @ts-expect-error
	const { files } = await cli.publish(config(patter, address, token, cwd));

	t.equal(
		files[6].pathname,
		"/path/to/folder/checkbox-sprite-nontouch.svg",
		"files should be packaged at path/to/folder",
	);
});

test("when a folder of files is specified as an absolute path string", async (t) => {
	const { address, token, cwd } = t.context;
	const pattern = join(__dirname, "./fixtures/icons");
	// @ts-expect-error
	const { files } = await cli.publish(config(pattern, address, token, cwd));

	t.equal(
		files[0].pathname,
		"/eik.json",
		"eik.json file should be at package root",
	);
	t.equal(
		files[6].pathname,
		"/checkbox-sprite-nontouch.svg",
		"files should be packaged at package root",
	);
});

test("when a folder of files is specified as an object", async (t) => {
	const { address, token, cwd } = t.context;
	const pattern = {
		"/icons": "./fixtures/icons",
	};
	// @ts-expect-error
	const { files } = await cli.publish(config(pattern, address, token, cwd));

	t.equal(
		files[6].pathname,
		"/icons/checkbox-sprite-nontouch.svg",
		"files should be packaged under /icons",
	);
});

test("when a folder of files is specified as an object with absolute path", async (t) => {
	const { address, token, cwd } = t.context;
	const pattern = {
		"/icons": join(__dirname, "./fixtures/icons"),
	};
	// @ts-expect-error
	const { files } = await cli.publish(config(pattern, address, token, cwd));

	t.equal(
		files[6].pathname,
		"/icons/checkbox-sprite-nontouch.svg",
		"files should be packaged under /icons",
	);
});

test("when 2 specific file name entries are specified", async (t) => {
	const { address, token, cwd } = t.context;
	const pattern = {
		"/esm.js": "./fixtures/client.js",
		"/esm.css": "./fixtures/styles.css",
	};
	// @ts-expect-error
	const { files } = await cli.publish(config(pattern, address, token, cwd));

	t.equal(files[1].pathname, "/esm.js", "client.js should be mapped to esm.js");
	t.equal(
		files[2].pathname,
		"/esm.css",
		"styles.js should be mapped to esm.css",
	);
});

test("when 2 specific file name entries are specified with absolute paths", async (t) => {
	const { address, token, cwd } = t.context;
	const pattern = {
		"/esm.js": join(__dirname, "./fixtures/client.js"),
		"/esm.css": join(__dirname, "./fixtures/styles.css"),
	};
	// @ts-expect-error
	const { files } = await cli.publish(config(pattern, address, token, cwd));

	t.equal(files[1].pathname, "/esm.js", "client.js should be mapped to esm.js");
	t.equal(
		files[2].pathname,
		"/esm.css",
		"styles.js should be mapped to esm.css",
	);
});

test("when a recursive glob is specified", async (t) => {
	const { address, token, cwd } = t.context;
	const pattern = "fixtures/**/*";
	// @ts-expect-error
	const { files } = await cli.publish(config(pattern, address, token, cwd));

	t.equal(
		files.find((f) => f.pathname.endsWith("client.js")).pathname,
		"/client.js",
		"client.js should be packaged at /",
	);
	t.equal(
		files.find((f) => f.pathname.endsWith("checkboxes.svg")).pathname,
		"/icons/checkboxes.svg",
		"svgs should be packaged under /icons",
	);
});

test("when a non recursive glob is specified", async (t) => {
	const { address, token, cwd } = t.context;
	const pattern = "fixtures/*";
	// @ts-expect-error
	const { files } = await cli.publish(config(pattern, address, token, cwd));

	const nested = files.filter((file) => file.pathname.includes("icons"));

	t.equal(
		files.find((f) => f.pathname.endsWith("client.js")).pathname,
		"/client.js",
		"client.js should be packaged at /",
	);
	t.equal(nested.length, 0, "no nested files should be present");
});

test("when a file is specified with a leading path", async (t) => {
	const { address, token, cwd } = t.context;
	const pattern = "fixtures/client.js";
	// @ts-expect-error
	const { files } = await cli.publish(config(pattern, address, token, cwd));

	t.equal(files[1].pathname, "/client.js", "the file should be packaged at /");
});

test("when a file is specified as an object and mapped with a leading path", async (t) => {
	const { address, token, cwd } = t.context;
	const pattern = { "path/to/esm.js": "fixtures/client.js" };
	// @ts-expect-error
	const { files } = await cli.publish(config(pattern, address, token, cwd));

	t.equal(
		files[1].pathname,
		"/path/to/esm.js",
		"the file should be packaged with the leading path and the mapping",
	);
});
