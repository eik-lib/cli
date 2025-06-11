import { createHash } from "node:crypto";
import fileHash from "./file.js";

/**
 * Reads files from given paths and produces and returns an integrity hash from all files contents
 *
 * @param {string[]} files - an array of file paths
 *
 * @returns {Promise<string>} - integrity string
 *
 * @example hash.files(['/path/to/file1.js', '/path/to/file2.js']);
 */
export default async (files) => {
	const hashes = await Promise.all(files.map(fileHash));
	const alg = "sha512";
	const hasher = createHash(alg);
	for (const hash of hashes.sort()) {
		hasher.update(hash);
	}
	const digest = hasher.digest().toString("base64");
	return `${alg}-${digest}`;
};
