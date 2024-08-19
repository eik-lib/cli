// @deprecated in favor of `alias` command

import ora from "ora";
import Alias from "../classes/alias.js";
import { logger, getDefaults } from "../utils/index.js";
import { Alias as AliasFormatter } from "../formatters/index.js";

export const command = "map-alias <name> <version> <alias>";

export const aliases = ["ma"];

export const describe = "Create an alias for a map";

export const deprecated = "map-alias is replaced by alias";

export const builder = (yargs) => {
	yargs
		.positional("name", {
			describe: `Import map name for import map that is to be aliased`,
			type: "string",
		})
		.positional("version", {
			describe: `Import map version for import map that is to be aliased`,
			type: "string",
		})
		.positional("alias", {
			describe: `Alias for a semver version. Should be the semver major component of version.`,
			type: "string",
		});

	yargs.options({
		server: {
			alias: "s",
			describe: "Specify location of asset server.",
		},
		token: {
			describe:
				"Provide a jwt token to be used to authenticate with the Eik server.",
			default: "",
			alias: "t",
		},
	});

	yargs.example(`eik map-alias my-map 1.0.0 1`);
	yargs.example(`eik map-alias my-map 1.7.3 1`);
	yargs.example(`eik map-alias my-map 6.3.1 6`);
	yargs.example(
		`eik map-alias my-map 6.3.1 6 --server https://assets.myeikserver.com`,
	);
	yargs.example(`eik map-alias my-map 4.2.2 4 --debug`);
};

export const handler = async (argv) => {
	const spinner = ora({ stream: process.stdout }).start("working...");
	let success = false;
	const { debug, name, version, server } = argv;
	const log = logger(spinner, debug);
	let data = {};

	try {
		data = await new Alias({
			type: "map",
			logger: log,
			...argv,
		}).run();

		data.name = name;
		data.version = version;
		data.files = [];

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
