import ora from "ora";
import Alias from "../classes/alias.js";
import { logger, getArgsOrDefaults } from "../utils/index.js";
import { Alias as AliasFormatter } from "../formatters/index.js";

export const command = "npm-alias <name> <version> <alias>";

export const aliases = ["na", "dep-alias", "dependency-alias"];

export const describe = "Create an alias for an NPM package";

export const deprecated = "npm-alias has been replaced by alias";

/** @type {import('yargs').CommandBuilder} */
export const builder = (yargs) => {
	return yargs
		.positional("name", {
			describe: "Name matching NPM package name.",
			type: "string",
		})
		.positional("version", {
			describe: "Version matching NPM package version.",
			type: "string",
		})
		.positional("alias", {
			describe:
				"Alias for a semver version. Must be the semver major component of version.",
			type: "string",
		})
		.options({
			server: {
				alias: "s",
				describe: "Eik server address, if different from configuration file",
			},
			token: {
				describe: "JWT used for authentication, if not using eik login",
				alias: "t",
			},
		})
		.example("eik npm-alias lit-html 1.0.0 1")
		.example(
			"eik npm-alias lit-html 5.3.2 5 --server https://assets.myeikserver.com",
		)
		.example("eik npm-alias lit-html 1.0.0 1 --token yourtoken");
};

export const handler = async (argv) => {
	const { debug, server, ...rest } = getArgsOrDefaults(argv);

	const spinner = ora({ stream: process.stdout }).start("working...");
	const log = logger(spinner, debug);

	let success = false;
	let data = {};
	try {
		data = await new Alias({
			debug,
			server,
			...rest,
			type: "npm",
			logger: log,
		}).run();

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
		new AliasFormatter(data).format(server);
	} else {
		process.exit(1);
	}
};
