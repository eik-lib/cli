import { createHash } from "node:crypto";
import fs from "node:fs/promises";

/**
 * Reads a file from a given path and produces and returns an integrity hash from its contents
 *
 * @param {string} path - path to file to hash
 *
 * @returns {Promise<string>} - integrity hash
 *
 * @example hash.file('/path/to/file.js');
 */
export default async (path) => {
	const alg = "sha512";
	const digest = createHash(alg)
		.update(await fs.readFile(path))
		.digest()
		.toString("base64");
	return `${alg}-${digest}`;
};
