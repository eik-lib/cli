import { promises as fs } from "fs";
import os from "os";
import { test } from "node:test";
import assert from "node:assert";
import { join, basename } from "path";
import { readFileSync } from "fs";
import { exec as execCallback } from "node:child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function exec(cmd) {
	return /** @type {Promise<void>} */ (
		new Promise((resolve) => {
			execCallback(cmd, (error, stdout, stderr) => {
				resolve({ error, stdout, stderr });
			});
		})
	);
}

test("Initializing a new eik.json file", async () => {
	const eik = join(__dirname, "..", "../index.js");
	const folder = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));
	const publishCmd = `node ${eik} init --cwd ${folder}`;

	let out = await exec(publishCmd);
	assert.strictEqual(out.error, null);

	const eikJson = JSON.parse(
		readFileSync(join(folder, "eik.json"), { encoding: "utf8" }),
	);
	assert.ok(eikJson["$schema"], 'eik.json "$schema" field should not be empty');
	assert.strictEqual(eikJson.name, "", 'eik.json "name" field should be empty');
	assert.strictEqual(eikJson.version, "1.0.0");
	assert.strictEqual(
		eikJson.server,
		"",
		'eik.json "server" field should be empty',
	);
	assert.deepStrictEqual(eikJson.files, "./public");
});

test("Initializing a new eik.json file passing custom values", async () => {
	const eik = join(__dirname, "..", "../index.js");
	const folder = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));
	const publishCmd = `node ${eik} init
        --cwd ${folder}
        --name custom-name
        --version 2.0.0
        --server http://localhost:4001`;

	let out = await exec(publishCmd.split("\n").join(" "));
	assert.strictEqual(out.error, null);

	const eikJson = JSON.parse(
		readFileSync(join(folder, "eik.json"), { encoding: "utf8" }),
	);

	assert.strictEqual(eikJson.name, "custom-name");
	assert.strictEqual(eikJson.version, "2.0.0");
	assert.strictEqual(eikJson.server, "http://localhost:4001");
	assert.deepStrictEqual(eikJson.files, "./public");
});

test("Initializing a new eik.json file in an existing project", async () => {
	const eik = join(__dirname, "..", "..", "index.js");
	const folder = await fs.mkdtemp(join(os.tmpdir(), basename(__filename)));

	const packageJson = {
		name: "legendary-app",
		version: "13.3.7",
	};

	await fs.writeFile(
		join(folder, "package.json"),
		JSON.stringify(packageJson, null, 2),
		"utf-8",
	);

	const publishCmd = `node ${eik} init --cwd ${folder}`;
	let out = await exec(publishCmd);
	assert.strictEqual(out.error, null);

	const eikJson = JSON.parse(
		readFileSync(join(folder, "eik.json"), { encoding: "utf8" }),
	);

	assert.strictEqual(eikJson.name, packageJson.name);
	assert.strictEqual(eikJson.version, packageJson.version);
});
