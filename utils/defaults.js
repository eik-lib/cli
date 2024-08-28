import fs from "fs";
import { helpers } from "@eik/common";
import { EikCliError, errors } from "./error.js";

const defaults = {
	name: "",
	type: "package",
	version: "1.0.0",
	server: "",
	out: "./.eik",
	files: "./public",
	"import-map": [],
};

/**
 * Get defaults for things like server, name and version from Eik config.
 * If a specific argument is given for it, that takes precedence.
 * @template [T=Record<string, unknown>]
 * @param {any} argv
 * @param {{ command: string; options?: string[] }} opts
 * @returns {import('@eik/common').EikConfig & typeof defaults & T}
 */
export function getArgsOrDefaults(argv, opts) {
	let { cwd, config: configPath } = argv;
	if (!cwd) {
		cwd = process.cwd();
	}

	let config = {};
	if (!opts.command.startsWith("init")) {
		let path = configPath || cwd;
		try {
			const stats = fs.statSync(path);
			if (stats.isDirectory()) {
				config = helpers.configStore.findInDirectory(path).toJSON();
			} else {
				config = helpers.configStore.loadFromPath(path).toJSON();
			}
		} catch (error) {
			const e = /** @type {Error} */ (error);
			if (e.constructor.name === "MissingConfigError") {
				if (!hasOptionsOnArgv(argv, opts.options)) {
					throw new EikCliError(
						errors.ERR_MISSING_CONFIG,
						`No eik.json or package.json with eik configuration in ${cwd}, and did not get required fields as options`,
						error,
					);
				}
			}
		}
	}

	const result = {
		...defaults,
		...config,
		...argv,
		cwd,
	};

	return result;
}

/**
 * @param {any} argv
 * @param {string[]} options
 * @returns {boolean}
 */
function hasOptionsOnArgv(argv, options = []) {
	for (const arg of options) {
		if (typeof argv[arg] === "undefined") {
			return false;
		}
	}
	return true;
}
