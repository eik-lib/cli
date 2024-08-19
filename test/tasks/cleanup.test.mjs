import { promises as fs } from "fs";
import { join } from "path";
import { test, beforeEach, afterEach } from "tap";
import { rimrafSync } from "rimraf";
import CleanupTask from "../../classes/publish/package/tasks/cleanup.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

beforeEach(async (t) => {
	const path = join(__dirname, ".eik");
	await fs.mkdir(path);
	await fs.copyFile(
		join(__dirname, "../fixtures/client.js"),
		join(__dirname, "./.eik/client.js"),
	);
	await fs.copyFile(
		join(__dirname, "../fixtures/styles.css"),
		join(__dirname, "./.eik/styles.css"),
	);
	await fs.copyFile(
		join(__dirname, "../fixtures/integrity.json"),
		join(__dirname, "./.eik/integrity.json"),
	);
	t.context.path = path;
});

afterEach((t) => {
	rimrafSync(t.context.path);
});

test("basic cleanup", async (t) => {
	const cleanup = new CleanupTask({ path: t.context.path });
	await cleanup.process();

	const files = await fs.readdir(t.context.path);
	t.equal(files.length, 1);
	t.equal(files[0], "integrity.json");
});
