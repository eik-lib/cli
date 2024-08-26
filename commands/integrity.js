import { join } from "path";
import Integrity from "../classes/integrity.js";
import json from "../utils/json/index.js";
import { commandHandler } from "../utils/command-handler.js";

export const command = "integrity [name] [version]";

export const aliases = ["int"];

export const describe = "Get file integrity information";

/** @type {import('yargs').CommandBuilder} */
export const builder = (yargs) => {
	return yargs
		.options({
			server: {
				alias: "s",
				describe: "Eik server address, if different from configuration file",
			},
		})
		.example("eik integrity")
		.example("eik integrity --server https://assets.myserver.com");
};

export const handler = commandHandler(
	{ command, options: ["server"] },
	async (argv, log, spinner) => {
		const { name, version, server, out, type, cwd, debug } = argv;

		const integrity = await new Integrity({
			logger: log,
			name,
			version,
			server,
			debug,
			cwd,
			type,
		}).run();

		if (integrity) {
			const filename = join(out, "integrity.json");
			await json.write(integrity, { cwd, filename });
			spinner.succeed(
				`integrity information for package "${name}" (v${version}) saved to "${filename}"`,
			);
			process.stdout.write("\n");
		}
	},
);
