import ora from "ora";
import logger from "./logger.js";
import { EikCliError } from "./error.js";
import { getArgsOrDefaults } from "./defaults.js";

/**
 * @typedef {ReturnType<import('./defaults.js').getArgsOrDefaults>} Argv
 * @typedef {ReturnType<import('./logger.js').default>} Logger
 * @typedef {import('ora').Ora} Spinner
 */

/**
 * @template [T=Record<string, unknown>]
 * @callback HandlerFunction
 * @param {Argv & T} argv
 * @param {Logger} log
 * @param {Spinner} spinner
 * @returns {Promise<void>}
 */

/**
 * @param {HandlerFunction} handlerFunction
 * @returns {import('yargs').CommandModule["handler"]}
 */
export function commandHandler(handlerFunction) {
	return async (argv) => {
		const spinner = ora({ stream: process.stdout }).start();
		const log = logger(spinner, argv.debug);

		try {
			await handlerFunction(getArgsOrDefaults(argv), log, spinner);

			spinner.text = "";
			spinner.stopAndPersist();
		} catch (e) {
			if (e instanceof EikCliError) {
				log.error(e.message);
				spinner.text = "";
				spinner.stopAndPersist();
				return process.exit(e.exitCode);
			}

			const error = /** @type {Error} */ (e);
			log.error(`${error.name}: ${error.message}`);

			if (argv.debug) {
				log.debug(error.stack);
			}

			spinner.text = "";
			spinner.stopAndPersist();
			process.exit(1);
		}
	};
}
