import fastify from "fastify";
import { promises as fs } from "fs";
import os from "os";
import { exec as execCallback } from "child_process";
import { join, basename } from "path";
import { test, beforeEach, afterEach } from "tap";
import EikService from "@eik/service";
import Sink from "@eik/sink-memory";
import cli from "../../classes/index.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function exec(cmd) {
	return new Promise((resolve) => {
		execCallback(cmd, (error, stdout, stderr) => {
			resolve({ error, stdout, stderr });
		});
	});
}

beforeEach(async (t) => {
	const memSink = new Sink();
	const server = fastify({ logger: false });
	const service = new EikService({ customSink: memSink });
	server.register(service.api());
	const address = await server.listen({
		host: "127.0.0.1",
		port: 0,
	});
	const folder = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));

	const token = await cli.login({
		server: address,
		key: "change_me",
	});

	t.context.server = server;
	t.context.address = address;
	t.context.folder = folder;
	t.context.token = token;
});

afterEach(async (t) => {
	await t.context.server.close();
});

test("eik package : package, details provided by eik.json file", async (t) => {
	const assets = {
		name: "test-app",
		version: "1.0.0",
		server: t.context.address,
		files: {
			"index.js": join(__dirname, "..", "fixtures", "client.js"),
			"index.css": join(__dirname, "..", "fixtures", "styles.css"),
		},
	};

	await fs.writeFile(
		join(t.context.folder, "eik.json"),
		JSON.stringify(assets),
	);

	const eik = join(__dirname, "..", "..", "index.js");
	const cmd = `node ${eik} package --token ${t.context.token} --cwd ${t.context.folder}`;

	const { error, stdout } = await exec(cmd);

	const res = await fetch(
		new URL("/pkg/test-app/1.0.0/index.js", t.context.address),
	);

	t.equal(res.ok, true);
	t.equal(error, null);
	t.match(stdout, "published");
	t.match(stdout, "less than a minute ago");
	t.match(stdout, "Generic User");
	t.end();
});

test("eik package : package, details provided by eik.json file - npm namespace", async (t) => {
	const assets = {
		name: "test-app",
		version: "1.0.0",
		type: "npm",
		server: t.context.address,
		files: {
			"index.js": join(__dirname, "..", "fixtures", "client.js"),
			"index.css": join(__dirname, "..", "fixtures", "styles.css"),
		},
	};

	await fs.writeFile(
		join(t.context.folder, "eik.json"),
		JSON.stringify(assets),
	);

	const eik = join(__dirname, "..", "..", "index.js");
	const cmd = `node ${eik} package --token ${t.context.token} --cwd ${t.context.folder} --npm`;

	const { error, stdout } = await exec(cmd);

	const res = await fetch(
		new URL("/npm/test-app/1.0.0/index.js", t.context.address),
	);

	t.equal(res.ok, true);
	t.equal(error, null);
	t.match(stdout, "NPM");
	t.match(stdout, "less than a minute ago");
	t.match(stdout, "Generic User");
	t.end();
});

test("eik package : package, details provided by eik.json file - explicit package namespace", async (t) => {
	const assets = {
		name: "test-app",
		version: "1.0.0",
		type: "package",
		server: t.context.address,
		files: {
			"index.js": join(__dirname, "..", "fixtures", "client.js"),
			"index.css": join(__dirname, "..", "fixtures", "styles.css"),
		},
	};

	await fs.writeFile(
		join(t.context.folder, "eik.json"),
		JSON.stringify(assets),
	);

	const eik = join(__dirname, "..", "..", "index.js");
	const cmd = `node ${eik} package --token ${t.context.token} --cwd ${t.context.folder} --npm`;

	const { error, stdout } = await exec(cmd);

	const res = await fetch(
		new URL("/pkg/test-app/1.0.0/index.js", t.context.address),
	);

	t.equal(res.ok, true);
	t.equal(error, null);
	t.match(stdout, "PACKAGE");
	t.match(stdout, "less than a minute ago");
	t.match(stdout, "Generic User");
	t.end();
});

test("eik package : package, details provided by package.json values", async (t) => {
	const assets = {
		name: "test-app",
		version: "1.0.0",
		eik: {
			server: t.context.address,
			files: {
				"index.js": join(__dirname, "..", "fixtures", "client.js"),
				"index.css": join(__dirname, "..", "fixtures", "styles.css"),
			},
		},
	};

	await fs.writeFile(
		join(t.context.folder, "package.json"),
		JSON.stringify(assets),
	);

	const eik = join(__dirname, "..", "..", "index.js");
	const cmd = `node ${eik} package --token ${t.context.token} --cwd ${t.context.folder}`;

	const { error, stdout } = await exec(cmd);

	const res = await fetch(
		new URL("/pkg/test-app/1.0.0/index.js", t.context.address),
	);

	t.equal(res.ok, true);
	t.equal(error, null);
	t.match(stdout, "published");
	t.match(stdout, "less than a minute ago");
	t.match(stdout, "Generic User");
	t.end();
});

test("eik package : package, details provided by package.json values and eik.json, throws error", async (t) => {
	const pkg = {
		name: "test-app",
		version: "1.0.0",
		eik: {
			server: t.context.address,
			files: {
				"index.js": join(__dirname, "..", "fixtures", "client.js"),
				"index.css": join(__dirname, "..", "fixtures", "styles.css"),
			},
		},
	};

	await fs.writeFile(
		join(t.context.folder, "package.json"),
		JSON.stringify(pkg),
	);

	const assets = {
		name: "test-app",
		version: "1.0.0",
		server: t.context.address,
		files: {
			"index.js": join(__dirname, "..", "fixtures", "client.js"),
			"index.css": join(__dirname, "..", "fixtures", "styles.css"),
		},
	};

	await fs.writeFile(
		join(t.context.folder, "eik.json"),
		JSON.stringify(assets),
	);

	const eik = join(__dirname, "..", "..", "index.js");
	const cmd = `node ${eik} package --token ${t.context.token} --cwd ${t.context.folder}`;

	const { error } = await exec(cmd);

	t.ok(error);
	t.end();
});

test("workflow: publish npm, alias npm, publish map, alias map and then publish package using map", async (t) => {
	const eik = join(__dirname, "..", "..", "index.js");
	let cmd = "";

	// publish npm dep
	let assets = {
		name: "scroll-into-view-if-needed",
		version: "2.2.24",
		type: "npm",
		server: t.context.address,
		files: {
			"index.js": join(__dirname, "..", "fixtures", "client.js"),
			"index.css": join(__dirname, "..", "fixtures", "styles.css"),
		},
	};

	await fs.writeFile(
		join(t.context.folder, "eik.json"),
		JSON.stringify(assets),
	);

	cmd = `node ${eik} package --token ${t.context.token} --cwd ${t.context.folder} --npm`;
	let out = await exec(cmd);
	t.equal(out.error, null);

	// alias npm dependency
	cmd = `node ${eik} npm-alias scroll-into-view-if-needed 2.2.24 2
				--cwd ${t.context.folder}
        --token ${t.context.token}
        --server ${t.context.address}`;
	out = await exec(cmd.split("\n").join(" "));
	t.equal(out.error, null);

	// create import map file locally
	const map = {
		imports: {
			"scroll-into-view-if-needed": new URL(
				"/npm/scroll-into-view-if-needed/v2/index.js",
				t.context.address,
			).href,
		},
	};
	await fs.writeFile(
		join(t.context.folder, "import-map.json"),
		JSON.stringify(map),
	);

	// upload import map file
	cmd = `node ${eik} map my-map 1.0.0 ./import-map.json
        --cwd ${t.context.folder}
        --token ${t.context.token}
        --server ${t.context.address}`;
	out = await exec(cmd.split("\n").join(" "));
	t.equal(out.error, null);

	// alias import map
	cmd = `node ${eik} map-alias my-map 1.0.0 1
				--cwd ${t.context.folder}
        --token ${t.context.token}
        --server ${t.context.address}`;
	out = await exec(cmd.split("\n").join(" "));
	t.equal(out.error, null);

	assets = {
		name: "test-app",
		version: "1.0.0",
		server: t.context.address,
		files: {
			"index.js": join(
				__dirname,
				"..",
				"fixtures",
				"client-with-bare-imports.js",
			),
			"index.css": join(__dirname, "..", "fixtures", "styles.css"),
		},
		"import-map": [new URL("/map/my-map/v1", t.context.address).href],
	};
	await fs.writeFile(
		join(t.context.folder, "eik.json"),
		JSON.stringify(assets),
	);

	// TODO: create a bundle that uses import maps

	// use import map when publishing app files
	// cmd = `node ${eik} package
	//     --token ${t.context.token}
	//     --cwd ${t.context.folder}
	//     --debug`;
	// out = await exec(cmd.split('\n').join(' '));
	// t.equal(out.error, null);

	// const res = await fetch(new URL('/pkg/test-app/1.0.0/index.js', t.context.address));
	// const text = await res.text();

	// t.equal(res.ok, true);
	// t.match(text, new URL(
	//     '/npm/scroll-into-view-if-needed/v2/index.js',
	//     t.context.address,
	// ).href)
});
