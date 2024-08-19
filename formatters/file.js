import { join } from "path";
import chalk from "chalk";

function readableBytes(bytes) {
	const i = Math.floor(Math.log(bytes) / Math.log(1024)),
		sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
	return (bytes / 1024 ** i).toFixed(2) * 1 + " " + sizes[i];
}

class File {
	constructor({
		pathname = "",
		mimeType = "",
		size = null,
		integrity = "",
	} = {}) {
		this.pathname = pathname;
		this.mimeType = mimeType;
		this.size = size;
		this.integrity = integrity;
	}

	format(baseURL = "") {
		const write = process.stdout.write.bind(process.stdout);
		const url = new URL(baseURL);

		const fileUrl = new URL(join(url.pathname, this.pathname), url.origin);
		write(`     - ${chalk.cyan(fileUrl.href)} `);
		write(`${chalk.yellow(this.mimeType)} `);
		write(`${chalk.magenta(readableBytes(this.size))}\n`);
		write(`       ${chalk.bold("integrity:")} ${this.integrity}\n`);
	}
}

export default File;
