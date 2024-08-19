import ora from "ora";
import Ping from "../classes/ping.js";
import { logger, getDefaults } from "../utils/index.js";

export const command = "ping [server]";

export const aliases = [];

export const describe = "Check that the Eik server is responding";

export const builder = (yargs) => {
	const defaults = getDefaults(yargs.argv.config || yargs.argv.cwd);

	yargs.positional("server", {
		describe: "Specify location of Eik server to ping.",
		default: defaults.server,
	});

	yargs.example(`eik ping`);
	yargs.example(`eik ping http://assets.myeikserver.com`);
	yargs.example(`eik ping http://assets.myeikserver.com --debug`);
};

export const handler = async (argv) => {
	const spinner = ora({ stream: process.stdout }).start("working...");
	const { debug, server } = argv;

	try {
		await new Ping({ logger: logger(spinner, debug), server }).run();
	} catch (err) {
		// @ts-expect-error
		logger.warn(err.message);
	}

	spinner.text = "";
	spinner.stopAndPersist();
};
