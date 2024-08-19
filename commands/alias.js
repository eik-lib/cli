import ora from "ora";
import semver from "semver";
import Alias from "../classes/alias.js";
import { logger, getDefaults } from "../utils/index.js";
import { Alias as AliasFormatter } from "../formatters/index.js";

export const command = "alias [name] [version] [alias]";

export const aliases = ["a"];

export const describe = `Create or update a semver major alias for a package or map`;

/** @type {import('yargs').CommandBuilder} */
export const builder = (yargs) => {
	// @ts-expect-error
	const defaults = getDefaults(yargs.argv.config || yargs.argv.cwd);

	yargs
		.positional("name", {
			describe: "Name matching a package or import map on the Eik server",
			type: "string",
			default: defaults.name,
		})
		.positional("version", {
			describe: "The version the alias should redirect to",
			type: "string",
			default: defaults.version,
		})
		.positional("alias", {
			describe:
				"Alias, should be the semver major component of version. Eg. 1.0.0 should be given the alias 1",
			type: "string",
			default: defaults.version ? semver.major(defaults.version) : null,
		})
		.options({
			server: {
				alias: "s",
				describe: "Specify location of Eik asset server.",
				default: defaults.server,
			},
			type: {
				describe:
					"Alter the alias type. Default is detected from eik.json. Valid values are `package`, `npm`, or `map` Eg. --type npm",
				default: defaults.type,
			},
			token: {
				describe:
					"Provide a jwt token to be used to authenticate with the Eik server.",
				default: "",
				alias: "t",
			},
		})
		.default("token", defaults.token, defaults.token ? "######" : "")
		.example(
			`eik alias my-app 1.0.0 1`,
			"Create an alias v1 for my-app pointing at 1.0.0",
		)
		.example(
			`eik alias my-app 1.7.3 1`,
			"Update an alias v1 for my-app to point at 1.7.3",
		)
		.example(
			`eik alias my-app 6.3.1 6 --server https://assets.myeikserver.com`,
			"Specify a server other than the one in eik.json",
		)
		.example(
			`eik alias my-app 4.2.2 4 --type package`,
			"Specify a package type other than the one in eik.json",
		);
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
