import fastify from "fastify";
import { promises as fs } from "fs";
import os from "os";
import { join, basename } from "path";
import { exec as execCallback } from "child_process";
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import EikService from "@eik/service";
import Sink from "@eik/sink-memory";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cli from "../../classes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 *
 * @param {string} cmd
 * @param {import('child_process').ExecException} opts
 * @returns
 */
function exec(cmd, opts = {}) {
	return new Promise((resolve) => {
		execCallback(cmd, opts, (error, stdout, stderr) => {
			resolve({ error, stdout, stderr });
		});
	});
}

describe("integration: version", () => {
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

		// Set up our fixtures in the tmp directory
		let packageJson = await fs.readFile(
			join(__dirname, "..", "fixtures", "images", "eik.json"),
			"utf-8",
		);
		packageJson = JSON.parse(packageJson);
		packageJson.server = address;
		await fs.writeFile(
			join(cwd, "eik.json"),
			JSON.stringify(packageJson),
			"utf-8",
		);

		let imageJson = await fs.readFile(
			join(__dirname, "..", "fixtures", "images", "eik-image.json"),
			"utf-8",
		);
		imageJson = JSON.parse(imageJson);
		imageJson.server = address;
		await fs.writeFile(
			join(cwd, "eik-image.json"),
			JSON.stringify(imageJson),
			"utf-8",
		);

		await fs.mkdir(join(cwd, "public"));
		await fs.mkdir(join(cwd, "public", "images"));
		await fs.mkdir(join(cwd, "public", "package"));
		await fs.copyFile(
			join(
				__dirname,
				"..",
				"fixtures",
				"images",
				"public",
				"images",
				"favicon.ico",
			),
			join(cwd, "public", "images", "favicon.ico"),
		);
		await fs.copyFile(
			join(
				__dirname,
				"..",
				"fixtures",
				"images",
				"public",
				"package",
				"app.js",
			),
			join(cwd, "public", "package", "app.js"),
		);

		// Make a git repo and initial commit so version can update it
		await exec(`git init`, { cwd });
		await exec(`git commit -a -m 'initial commit'`, { cwd });

		// Publish the packages to our in-memory store so we have something to version
		const eik = join(__dirname, "..", "..", "index.js");

		let res = await exec(
			`node ${eik} publish --server ${address} --cwd ${cwd} --token ${token}`,
		);
		if (res.error) {
			console.error(res.stdout);
			console.error(res.stderr);
			throw new Error(res.error);
		}

		res = await exec(
			`node ${eik} publish --server ${address} --cwd ${cwd} --token ${token} --config eik-image.json`,
		);
		if (res.error) {
			console.error(res.stdout);
			console.error(res.stderr);
			throw new Error(res.error);
		}
	});

	afterEach(async () => {
		await server.close();
	});

	test("versions the correct eik JSON when passed --config", async () => {
		// Create a diff so we can get a new version
		await fs.copyFile(
			join(__dirname, "..", "fixtures", "icons", "radio.svg"),
			join(cwd, "public", "images", "radio.svg"),
		);

		const eik = join(__dirname, "..", "..", "index.js");
		const cmd = `node ${eik} version --server ${address} --cwd ${cwd} --config eik-image.json`;
		const res = await exec(cmd);

		assert.strictEqual(res.error, null);
		if (res.error) return;

		assert.ok(res.stdout.includes("eik-image.json"));

		const eikImageJson = await fs.readFile(
			join(cwd, "eik-image.json"),
			"utf-8",
		);
		assert.ok(eikImageJson.includes('"version": "1.0.1"'));
	});
});
