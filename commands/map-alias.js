import Alias from "../classes/alias.js";
import { Alias as AliasFormatter } from "../formatters/index.js";
import { commandHandler } from "../utils/command-handler.js";

export const command = "map-alias <name> <version> <alias>";

export const aliases = ["ma"];

export const describe = "Create an alias for a map";

export const deprecated = "map-alias has been replaced by alias";

/** @type {import('yargs').CommandBuilder} */
export const builder = (yargs) => {
	return yargs
		.positional("name", {
			describe: "Import map package name",
			type: "string",
		})
		.positional("version", {
			describe: "Import map version",
			type: "string",
		})
		.positional("alias", {
			describe:
				"Alias value, the semver major component of the import map version",
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
		.example("eik map-alias my-map 1.0.0 1")
		.example("eik map-alias my-map 1.7.3 1")
		.example("eik map-alias my-map 6.3.1 6")
		.example(
			"eik map-alias my-map 6.3.1 6 --server https://assets.myeikserver.com",
		)
		.example("eik map-alias my-map 6.3.1 6 --token yourtoken");
};

export const handler = commandHandler(
	{ command, options: ["server"] },
	async (argv, log) => {
		const { debug, name, version, server, ...rest } = argv;

		const data = await new Alias({
			debug,
			name,
			version,
			server,
			...rest,
			type: "map",
			logger: log,
		}).run();

		data.name = name;
		data.version = version;
		data.files = [];

		const createdOrUpdated = data.update ? "Updated" : "Created";

		log.info(
			`${createdOrUpdated} alias for package "${data.name}". ("${data.version}" => "v${data.alias}")`,
		);

		new AliasFormatter(data).format(server);
	},
);
