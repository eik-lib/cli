import { join } from "path";
import PublishMap from "../classes/publish/map.js";
import Artifact from "../formatters/artifact.js";
import { commandHandler } from "../utils/command-handler.js";

export const command = "map <name> <version> <file>";

export const aliases = ["m"];

export const describe = "Publish an import map to the server";

/** @type {import('yargs').CommandBuilder} */
export const builder = (yargs) => {
	return yargs
		.positional("name", {
			describe: "Import map name.",
			type: "string",
		})
		.positional("version", {
			describe: "Import map version.",
			type: "string",
		})
		.positional("file", {
			describe:
				"Path to import map file on local disk relative to the current working directory.",
			type: "string",
			normalize: true,
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
		.example("eik map my-map 1.0.0 ./import-map.json")
		.example(
			"eik map my-map 2.1.1 ./import-map.json --server https://assets.myeikserver.com",
		)
		.example("eik map my-map 1.0.0 ./import-map.json --token yourtoken");
};

export const handler = commandHandler(
	{ command, options: ["server"] },
	async (argv, log) => {
		const { debug, name, version, server, ...rest } = argv;

		await new PublishMap({
			logger: log,
			debug,
			name,
			version,
			server,
			...rest,
		}).run();

		let url = new URL(join("map", name), server);
		let res = await fetch(url);
		const pkgMeta = await res.json();

		url = new URL(join("map", name, version), server);
		res = await fetch(url);

		log.info(`Published import map "${name}" at version "${version}"`);

		const artifact = new Artifact(pkgMeta);
		const versions = new Map(pkgMeta.versions);
		artifact.versions = Array.from(versions.values());
		artifact.format(server);

		process.stdout.write("\n");
	},
);
