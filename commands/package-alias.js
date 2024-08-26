import Alias from "../classes/alias.js";
import { Alias as AliasFormatter } from "../formatters/index.js";
import { commandHandler } from "../utils/command-handler.js";

export const command = "package-alias [name] [version] [alias]";

export const aliases = ["pkg-alias", "pa"];

export const describe = "Create an alias for a package";

export const deprecated = "package-alias has been replaced by alias";

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
				describe: "JWT used for authentication, if not using eik login",
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

export const handler = commandHandler(
	{ command, options: ["server"] },
	async (argv, log) => {
		const { debug, server, ...rest } = argv;

		const data = await new Alias({
			debug,
			server,
			...rest,
			type: "pkg",
			logger: log,
		}).run();

		const af = new AliasFormatter(data);

		const createdOrUpdated = data.update ? "Updated" : "Created";
		log.info(
			`${createdOrUpdated} alias for package "${data.name}". ("${data.version}" => "v${data.alias}")`,
		);

		af.format(server);
	},
);
