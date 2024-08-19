import ora from "ora";
import Meta from "../classes/meta.js";
import { Artifact } from "../formatters/index.js";
import { logger, getDefaults } from "../utils/index.js";

export const command = "meta <name>";

export const aliases = ["show"];

export const describe = `Get information about a package`;

export const builder = (yargs) => {
	const defaults = getDefaults(yargs.argv.config || yargs.argv.cwd);

	yargs.positional("name", {
		describe: "Name matching one or more of package, npm or import map name",
		type: "string",
	});

	yargs.options({
		server: {
			alias: "s",
			describe: "Specify location of asset server.",
			// @ts-expect-error
			default: defaults.server,
		},
	});

	yargs.example(`eik meta lit-html`);
	yargs.example(`eik meta my-map --debug`);
	yargs.example(`eik meta my-app --server https://assets.myeikserver.com`);
};

export const handler = async (argv) => {
	const spinner = ora({ stream: process.stdout }).start("working...");
	let meta = false;
	const { debug, server } = argv;
	const l = logger(spinner, debug);

	try {
		// @ts-expect-error
		meta = await new Meta({ logger: l, ...argv }).run();
		spinner.text = "";
		spinner.stopAndPersist();
	} catch (err) {
		spinner.text = "";
		spinner.stopAndPersist();
		l.warn(err.message);
		process.exit(1);
	}

	if (meta) {
		for (const m of Object.values(meta)) {
			const artifact = new Artifact(m);
			artifact.format(server);
			process.stdout.write(`\n`);
		}
	}
};
