import os from "os";
import readline from "readline";
import ora from "ora";
import Login from "../classes/login.js";
import { logger, getArgsOrDefaults } from "../utils/index.js";
import json from "../utils/json/index.js";

const homedir = os.homedir();

export const command = "login";

export const aliases = [];

export const describe = "Log in to an Eik server";

/** @type {import('yargs').CommandBuilder} */
export const builder = (yargs) => {
	return yargs
		.options({
			server: {
				alias: "s",
				describe: "Eik server address, if different from configuration file",
				type: "string",
			},
			key: {
				alias: "k",
				describe: "Login access key",
				type: "string",
			},
		})
		.example("eik login --server https://assets.myserver.com")
		.example("eik login --server https://assets.myserver.com --key yourkey");
};

export const handler = async (argv) => {
	const { debug, key, server } = getArgsOrDefaults(argv);

	let k = key;
	let s = server;
	let rl = null;

	if (!s || !k) {
		rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
	}

	if (!s) {
		await new Promise((resolve) => {
			rl?.question("Enter Eik server address > ", (input) => {
				s = input;
				// @ts-expect-error
				resolve();
			});
		});
	}

	if (!k) {
		await new Promise((resolve) => {
			rl?.question(`Enter login key for ${s} > `, (input) => {
				k = input;
				// @ts-expect-error
				resolve();
			});
		});
	}

	if (rl) rl.close();

	const spinner = ora({ stream: process.stdout }).start("working...");

	let success = false;
	try {
		const token = await new Login({
			logger: logger(spinner, debug),
			key: k,
			server: s,
		}).run();

		if (token) {
			const meta = /** @type {{ tokens: any }} */ (
				await json.read({ cwd: homedir, filename: ".eikrc" })
			);

			const tokens = new Map(meta.tokens);
			tokens.set(s, token);
			meta.tokens = Array.from(tokens);

			await json.write(meta, { cwd: homedir, filename: ".eikrc" });
			success = true;
		}
	} catch (err) {
		// @ts-expect-error
		logger.warn(err.message);
	}

	if (success) {
		spinner.text = "";
		spinner.stopAndPersist();
	} else {
		spinner.text = "";
		spinner.stopAndPersist();
		process.exit(1);
	}
};
