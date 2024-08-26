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
	}

	const result = {
		...defaults,
		...config,
		...argv,
		cwd,
	};

	return result;
}
