import os from "os";
import readline from "readline";
import Login from "../classes/login.js";
import json from "../utils/json/index.js";
import { commandHandler } from "../utils/command-handler.js";

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

export const handler = commandHandler(
	{ command, options: ["server"] },
	async (argv, logger, spinner) => {
		const { key, server } = argv;

		let k = key;
		let s = server;
		let rl = null;

		if (!s || !k) {
			spinner.stop();
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

		spinner.start();
		const token = await new Login({
			logger,
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
		}
	},
);
