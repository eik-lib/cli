import { promises as fs, rmSync } from "fs";
import { join } from "path";
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import CleanupTask from "../../classes/publish/package/tasks/cleanup.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("cleanup", () => {
	let path;

	beforeEach(async () => {
		path = join(__dirname, ".eik");
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
	});

	afterEach(() => {
		rmSync(path, { recursive: true, force: true });
	});

	test("basic cleanup", async () => {
		const cleanup = new CleanupTask({ path });
		await cleanup.process();

		const files = await fs.readdir(path);
		assert.strictEqual(files.length, 1);
		assert.strictEqual(files[0], "integrity.json");
	});
});
