import { join } from "path";
import ora from "ora";
import Integrity from "../classes/integrity.js";
import { logger, getDefaults } from "../utils/index.js";
import json from "../utils/json/index.js";

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

export const handler = async (argv) => {
	const spinner = ora({ stream: process.stdout }).start("working...");
	let integrity = false;
	const { debug, cwd, config } = argv;
	const l = logger(spinner, debug);
	// @ts-expect-error
	const { name, version, server, out, type } = getDefaults(config || cwd);

	try {
		integrity = await new Integrity({
			logger: l,
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
	} catch (err) {
		spinner.text = "";
		spinner.stopAndPersist();
		l.warn(err.message);
		process.exit(1);
	}
};
