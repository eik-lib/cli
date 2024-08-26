import ora from "ora";
import Ping from "../classes/ping.js";
import { logger, getArgsOrDefaults } from "../utils/index.js";

// TODO: replace positional argument with --server to be in line with other commands
export const command = "ping [server]";

export const aliases = [];

export const describe = "Check that the Eik server is responding";

/** @type {import('yargs').CommandBuilder} */
export const builder = (yargs) => {
	return yargs
		.positional("server", {
			describe: "Specify location of Eik server to check against.",
		})
		.example("eik ping")
		.example("eik ping http://assets.myeikserver.com");
};

export const handler = async (argv) => {
	const { debug, server } = getArgsOrDefaults(argv);

	const spinner = ora({ stream: process.stdout }).start("working...");

	try {
		await new Ping({ logger: logger(spinner, debug), server }).run();
	} catch (err) {
		// @ts-expect-error
		logger.warn(err.message);
	}

	spinner.text = "";
	spinner.stopAndPersist();
};
