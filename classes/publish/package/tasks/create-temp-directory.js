import { mkdirSync } from "fs";
import Task from "./task.js";

class IOError extends Error {
	constructor(message, err) {
		super(`${message}: ${err.message}`);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

export default class CreateTempDir extends Task {
	async process() {
		const { log, path } = this;

		log.debug(`Creating temporary directory`);
		log.debug(`  ==> ${path}`);

		try {
			mkdirSync(path, { recursive: true });
		} catch (err) {
			throw new IOError("Unable to create temp dir", err);
		}
	}
}
