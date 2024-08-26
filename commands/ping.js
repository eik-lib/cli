import Ping from "../classes/ping.js";
import { commandHandler } from "../utils/command-handler.js";

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

export const handler = commandHandler(async (argv, logger) => {
	const { server } = argv;
	await new Ping({ logger, server }).run();
});
