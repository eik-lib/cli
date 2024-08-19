import bytes from "bytes";
import fs from "fs";
import { gzipSizeSync } from "gzip-size";
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
					} => ${file}): ${bytes(gzipSizeSync(fs.readFileSync(file, "utf8")))}`,
				);
			}
		} catch (err) {
			throw new Error(`Failed to check bundle sizes: ${err.message}`);
		}
	}
}
