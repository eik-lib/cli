import { join } from "node:path";
import c from "tinyrainbow";
import File from "./file.js";

function colorType(type) {
	if (type === "npm") {
		return c.white(c.bgRed(c.bold(" NPM ")));
	}

	if (type === "pkg") {
		return c.white(c.bgYellow(c.bold(" PACKAGE ")));
	}

	if (type === "img") {
		return c.white(c.bgYellow(c.bold(" IMAGE ")));
	}

	return c.white(c.bgBlue(c.bold(" IMPORT MAP ")));
}

class Alias {
	constructor({
		type = "",
		name = "",
		alias = "",
		version = "",
		update = false,
		files = [],
		org = "",
		integrity = "",
	} = {}) {
		this.type = type;
		this.name = name;
		this.org = org;
		this.alias = alias;
		this.version = version;
		this.files = files;
		this.update = update;
		this.integrity = integrity;
	}

	format(baseURL = "") {
		const write = process.stdout.write.bind(process.stdout);
		const url = new URL(join(this.type, this.name, `v${this.alias}`), baseURL);

		write(`:: `);

		write(`${colorType(this.type)} > ${c.green(this.name)} | `);
		write(`${c.bold("org:")} ${this.org} | `);
		write(`${c.bold("version:")} ${this.version} | `);
		write(`${c.bold("alias:")} v${this.alias} `);

		if (this.update) {
			write(`${c.bgMagenta(c.white(" UPDATED \n\n"))}`);
		} else {
			write(`${c.bgGreen(c.white(" NEW "))}\n\n`);
		}

		if (url.href) {
			write(`   ${c.bold("url:      ")} ${c.cyan(url.href)}\n`);
		}

		if (this.integrity) {
			write(`   ${c.bold("integrity:")} ${this.integrity}\n`);
		}

		if (this.files.length) {
			write(`\n   ${c.bold("files:")}\n`);
		}

		for (const file of this.files) {
			new File(file).format(url.href);
			write(`\n`);
		}
		write(`\n`);
	}
}

export default Alias;
