import ora from "ora";
import Alias from "../classes/alias.js";
import { logger } from "../utils/index.js";
import { Alias as AliasFormatter } from "../formatters/index.js";

export const command = "alias [name] [version] [alias]";

export const aliases = ["a"];

export const describe =
	"Create or update a semver major alias for a package or map";

/** @type {import('yargs').CommandBuilder} */
export const builder = (yargs) => {
	return yargs
		.positional("name", {
			describe: "Name matching a package or import map on the Eik server",
			type: "string",
		})
		.positional("version", {
			describe: "The version the alias should redirect to",
			type: "string",
		})
		.positional("alias", {
			describe:
				"Alias, should be the semver major component of version. Eg. 1.0.0 should be given the alias 1",
			type: "string",
		})
		.options({
			server: {
				alias: "s",
				describe: "Eik server address, if different from configuration file",
			},
			type: {
				describe:
					"Alter the alias type. Default is detected from eik.json. Valid values are `package`, `npm`, or `map` Eg. --type npm",
			},
			token: {
				describe: "JTW used for authentication, if not using eik login",
				alias: "t",
			},
		})
		.example("eik alias my-app 1.0.0 1")
		.example("eik alias my-app 1.7.3 1")
		.example("eik alias my-app 6.3.1 6 --server https://assets.myeikserver.com")
		.example("eik alias my-app 6.3.1 6 --token yourtoken")
		.example("eik alias my-app 4.2.2 4 --type package");
};

export const handler = async (argv) => {
	const spinner = ora({ stream: process.stdout }).start("working...");
	let success = false;
	const { debug, server, type } = argv;
	const log = logger(spinner, debug);
	let af;

	try {
		const data = await new Alias({
			type,
			logger: log,
			...argv,
		}).run();

		// TODO: get rid of this rediculous formatter class idea that past me put here to irk present and future me.
		// Smells like DRY silliness
		af = new AliasFormatter(data);

		const createdOrUpdated = data.update ? "Updated" : "Created";
		log.info(
			`${createdOrUpdated} alias for "${type}" "${data.name}". ("${data.version}" => "v${data.alias}")`,
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
