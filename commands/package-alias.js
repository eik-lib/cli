import ora from "ora";
import Alias from "../classes/alias.js";
import { logger } from "../utils/index.js";
import { Alias as AliasFormatter } from "../formatters/index.js";

export const command = "package-alias [name] [version] [alias]";

export const aliases = ["pkg-alias", "pa"];

export const describe = "Create an alias for a package";

export const deprecated = "package-alias is replaced by alias";

/** @type {import('yargs').CommandBuilder} */
export const builder = (yargs) => {
	return yargs
		.positional("name", {
			describe: "Name matching existing name for a package on Eik server",
			type: "string",
		})
		.positional("version", {
			describe: "Version matching existing version for a package on Eik server",
			type: "string",
		})
		.positional("alias", {
			describe:
				"Alias for a semver version. Must be the semver major component of version. Eg. 1.0.0 should be given as 1",
			type: "string",
		})
		.options({
			server: {
				alias: "s",
				describe: "Eik server address, if different from configuration file",
			},
			token: {
				describe: "JTW used for authentication, if not using eik login",
				alias: "t",
			},
		})
		.example("eik package-alias my-app 1.0.0 1")
		.example("eik package-alias my-app 1.7.3 1")
		.example("eik package-alias my-app 6.3.1 6")
		.example(
			"eik package-alias my-app 6.3.1 6 --server https://assets.myeikserver.com",
		)
		.example("eik package-alias my-app 4.2.2 4 --token yourtoken");
};

export const handler = async (argv) => {
	const spinner = ora({ stream: process.stdout }).start("working...");
	let success = false;
	const { debug, server } = argv;
	const log = logger(spinner, debug);
	let af;

	try {
		const data = await new Alias({
			type: "pkg",
			logger: log,
			...argv,
		}).run();

		af = new AliasFormatter(data);

		const createdOrUpdated = data.update ? "Updated" : "Created";
		log.info(
			`${createdOrUpdated} alias for package "${data.name}". ("${data.version}" => "v${data.alias}")`,
		);
		success = true;
	} catch (err) {
		log.warn(err.message);
	}

	spinner.text = "";
	spinner.stopAndPersist();
	if (success) {
		af?.format(server);
	} else {
		process.exit(1);
	}
};
