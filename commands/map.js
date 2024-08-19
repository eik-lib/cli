import { join } from "path";
import ora from "ora";
import PublishMap from "../classes/publish/map.js";
import { logger } from "../utils/index.js";
import { Artifact } from "../formatters/index.js";

export const command = "map <name> <version> <file>";

export const aliases = ["m"];

export const describe = "Publish an import map to the server";

export const builder = (yargs) => {
	yargs
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

	yargs.example(`eik map my-map 1.0.0 ./import-map.json`);
	yargs.example(`eik map my-map 2.1.0 ./import-map.json --debug`);
	yargs.example(
		`eik map my-map 2.1.1 ./import-map.json --server https://assets.myeikserver.com`,
	);
};

export const handler = async (argv) => {
	const spinner = ora({ stream: process.stdout }).start("working...");
	const { debug, server, name, version } = argv;

	try {
		const log = logger(spinner, debug);

		await new PublishMap({ logger: log, ...argv }).run();

		let url = new URL(join("map", name), server);
		let res = await fetch(url);
		const pkgMeta = await res.json();

		url = new URL(join("map", name, version), server);
		res = await fetch(url);

		log.info(`Published import map "${name}" at version "${version}"`);

		spinner.text = "";
		spinner.stopAndPersist();

		const artifact = new Artifact(pkgMeta);
		const versions = new Map(pkgMeta.versions);
		artifact.versions = Array.from(versions.values());
		artifact.format(server);

		process.stdout.write("\n");
	} catch (err) {
		spinner.warn(err.message);
		spinner.text = "";
		spinner.stopAndPersist();
		process.exit(1);
	}
};
