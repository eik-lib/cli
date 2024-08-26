import { helpers } from "@eik/common";

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
 * @param {{ init?: boolean }} [opts]
 * @returns {import('@eik/common').EikConfig & typeof defaults & T}
 */
export function getArgsOrDefaults(argv, opts = { init: false }) {
	let { cwd, config: configPath } = argv;
	if (!cwd) {
		cwd = process.cwd();
	}

	let config = {};
	if (!opts.init) {
		let path = configPath || cwd;
		config = helpers.getDefaults(path).toJSON();
		// TODO: make so we can do this to give better feedback on missing configs
		// let path = configPath || cwd;
		// try {
		// 	const stats = fs.statSync(path);
		// 	if (stats.isDirectory()) {
		// 		config = helpers.configStore.findInDirectory(path);
		// 	} else {
		// 		config = helpers.configStore.loadFromPath(path);
		// 	}
		// } catch (error) {
		// 	const e = /** @type {Error} */ (error);
		// 	if (e.constructor.name === "MissingConfigError") {
		// 		throw new EikCliError(
		// 			errors.ERR_MISSING_CONFIG,
		// 			`No eik.json or package.json with eik configuration in ${cwd}`,
		// 			error,
		// 		);
		// 	}
		// }
	}

	const result = {
		...defaults,
		...config,
		...argv,
		cwd,
	};

	return result;
}
