import fs from "fs";
import { join, isAbsolute } from "path";
import configStore from "@eik/common/lib/helpers/config-store.js";
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
 * @returns {import('@eik/common').EikConfig & typeof defaults & { configFile: string } & T}
 */
export function getArgsOrDefaults(argv, opts) {
	let { cwd, config: configPath } = argv;
	if (!cwd) {
		cwd = process.cwd();
	}

	let config = {
		configFile: "eik.json",
	};
	if (!opts.command.startsWith("init")) {
		let path = cwd;
		if (configPath) {
			path = isAbsolute(configPath) ? configPath : join(cwd, configPath);
		}
		try {
			const stats = fs.statSync(path);
			/** @type {import('@eik/common').EikConfig} */
			let eikConfig;
			if (stats.isDirectory()) {
				eikConfig = configStore.findInDirectory(path);
			} else {
				eikConfig = configStore.loadFromPath(path);
				config.configFile = configPath;
			}
			config = {
				...config,
				name: eikConfig.name,
				version: eikConfig.version,
				type: eikConfig.type,
				server: eikConfig.server,
				token: eikConfig.token,
				files: eikConfig.files,
				out: eikConfig.out,
			};
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
