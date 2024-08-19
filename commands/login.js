import os from "os";
import readline from "readline";
import ora from "ora";
import Login from "../classes/login.js";
import { logger, getDefaults } from "../utils/index.js";
import json from "../utils/json/index.js";

const homedir = os.homedir();

export const command = "login";

export const aliases = [];

export const describe = `Log in to an Eik server`;

export const builder = (yargs) => {
	yargs.example("eik login --server https://assets.myserver.com");
	yargs.example("eik login --server https://assets.myserver.com --key ######");
	yargs.example("eik login --server https://assets.myserver.com --debug");

	const defaults = getDefaults(yargs.argv.config || yargs.argv.cwd);

	yargs.options({
		server: {
			alias: "s",
			describe: `Eik server address. Specify location of the Eik asset server to authenticate against. If an eik.json file is present in the current working directory, the files server value will be used as default. If no eik.json file is present in the current working directory and this flag is not specified, a prompt will be presented to ask for the server address to be input. Eg. --server https://assets.myeikserver.com`,
			type: "string",
			default: defaults.server,
		},
		key: {
			alias: "k",
			describe: `Login access key. This is a passkey for a given user account and needs to be configured on the server. If this flag is not specifed, a prompt will be used to ask for the key to be input. Eg. --key ########`,
			type: "string",
			default: "",
		},
	});
};

export const handler = async (argv) => {
	let success = false;
	const { debug, key, server } = argv;
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
