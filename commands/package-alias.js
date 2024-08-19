// @deprecated in favor of `alias` command

import ora from "ora";
import semver from "semver";
import Alias from "../classes/alias.js";
import { logger, getDefaults } from "../utils/index.js";
import { Alias as AliasFormatter } from "../formatters/index.js";

export const command = "package-alias [name] [version] [alias]";

export const aliases = ["pkg-alias", "pa"];

export const describe = "Create an alias for a package";

export const deprecated = "package-alias is replaced by alias";

export const builder = (yargs) => {
	const defaults = getDefaults(yargs.argv.config || yargs.argv.cwd);

	yargs
		.positional("name", {
			describe: "Name matching existing name for a package on Eik server",
			type: "string",
			default: defaults.name,
		})
		.positional("version", {
			describe: "Version matching existing version for a package on Eik server",
			type: "string",
			default: defaults.version,
		})
		.positional("alias", {
			describe:
				"Alias for a semver version. Must be the semver major component of version. Eg. 1.0.0 should be given as 1",
			type: "string",
			default: defaults.version ? semver.major(defaults.version) : null,
		});

	yargs.options({
		server: {
			alias: "s",
			describe: "Specify location of Eik asset server.",
			default: defaults.server,
		},
		token: {
			describe:
				"Provide a jwt token to be used to authenticate with the Eik server.",
			default: "",
			alias: "t",
		},
	});

	yargs.default("token", defaults.token, defaults.token ? "######" : "");

	yargs.example(`eik package-alias my-app 1.0.0 1`);
	yargs.example(`eik package-alias my-app 1.7.3 1`);
	yargs.example(`eik package-alias my-app 6.3.1 6`);
	yargs.example(
		`eik package-alias my-app 6.3.1 6 --server https://assets.myeikserver.com`,
	);
	yargs.example(`eik package-alias my-app 4.2.2 4 --debug`);
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
