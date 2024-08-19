import { join } from "path";
import Task from "./task.js";

export default class DryRun extends Task {
	async process(zipFile) {
		const { path } = this;

		const files = [
			{ pathname: path, type: "temporary directory" },
			{ pathname: zipFile, type: "package archive" },
		];

		const mappings = await this.config.mappings();

		for (const mapping of mappings) {
			const destination = join(path, mapping.destination.filePathname);
			files.push({ pathname: destination, type: "package file" });
		}

		return files;
	}
}
