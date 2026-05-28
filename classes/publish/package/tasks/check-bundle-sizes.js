import bytes from "bytes";
import fs from "fs";
import zlib from "node:zlib";
import Task from "./task.js";

export default class CheckBundleSizes extends Task {
	async process() {
		this.log.debug("Checking bundle file sizes");
		try {
			for (const mapping of await this.config.mappings()) {
				const file = mapping.source.absolute;
				this.log.debug(
					`  ==> entrypoint size (${
						mapping.source.destination
					} => ${file}): ${bytes(zlib.gzipSync(fs.readFileSync(file)).length)}`,
				);
			}
		} catch (err) {
			throw new Error(
				`Failed to check bundle sizes: ${/** @type {any} */ (err).message}`,
				{
					cause: err,
				},
			);
		}
	}
}
