import Meta from "../classes/meta.js";
import { Artifact } from "../formatters/index.js";
import { commandHandler } from "../utils/command-handler.js";

export const command = "meta <name>";

export const aliases = ["show"];

export const describe = "Get information about a package";

/** @type {import('yargs').CommandBuilder} */
export const builder = (yargs) => {
	return yargs
		.positional("name", {
			describe: "Name matching one or more of package, npm or import map name",
			type: "string",
		})
		.options({
			server: {
				alias: "s",
				describe: "Eik server address, if different from configuration file",
			},
		})
		.example("eik meta lit-html")
		.example("eik meta my-map --debug")
		.example("eik meta my-app --server https://assets.myeikserver.com");
};

export const handler = commandHandler(
	{ command, options: ["server"] },
	async (argv, log) => {
		const { debug, server, ...rest } = argv;

		const meta = await new Meta({ logger: log, debug, server, ...rest }).run();
		if (meta) {
			for (const m of Object.values(meta)) {
				const artifact = new Artifact(m);
				artifact.format(server);
				process.stdout.write(`\n`);
			}
		}
	},
);
