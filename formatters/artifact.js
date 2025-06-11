import { join } from "path";
import c from "tinyrainbow";
import Version from "./version.js";

const _name = Symbol("name");
const _type = Symbol("type");
const _org = Symbol("org");
const _versions = Symbol("versions");

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

class Artifact {
	constructor({ type = "", name = "", org = "", versions = [] } = {}) {
		this.type = type;
		this.name = name;
		this.org = org;
		this.versions = versions;
	}

	get type() {
		return this[_type];
	}

	set type(type) {
		this[_type] = type;
	}

	get name() {
		return this[_name];
	}

	set name(name) {
		this[_name] = name;
	}

	get org() {
		return this[_org];
	}

	set org(org) {
		this[_org] = org;
	}

	get versions() {
		return this[_versions];
	}

	set versions(versions) {
		const v = [];
		for (const version of versions) {
			v.push(new Version(version, this.baseURL));
		}
		this[_versions] = v;
	}

	format(baseURL = "") {
		const write = process.stdout.write.bind(process.stdout);
		const url = new URL(join(this.type, this.name), baseURL);

		write(`:: ${colorType(this.type)} > ${c.green(this.name)} | `);
		write(`${c.bold("org:")} ${this.org} | `);
		write(`${c.bold("url:")} ${c.cyan(url.href)}\n`);

		if (this.versions.length) {
			write(`\n   ${c.bold("versions:")}\n`);
		}

		for (const version of this.versions) {
			version.format(url.href);
			write(`\n`);
		}
	}
}

export default Artifact;
