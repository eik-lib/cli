#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { join } from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { commands } from "./commands/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { version } = JSON.parse(
	readFileSync(join(__dirname, "./package.json"), { encoding: "utf-8" }),
);

// Short circuit and provide a -v and --version flag.
// It's a known limitation in yargs that you can't have both a command
// and an option named version https://github.com/yargs/yargs/issues/2064
// We use the version name as a command in yargs, so handle the version
// option before using yargs.
if (
	process.argv.includes("-v") ||
	// last position only to avoid conflict with publish command
	process.argv[process.argv.length - 1].includes("--version")
) {
	console.log(version);
	process.exit(0);
}

yargs(hideBin(process.argv))
	.options({
		config: {
			alias: "c",
			describe:
				"Provide an exact path to an eik.json or package.json file to use as config. Default is eik.json in the current working directory.",
		},
		cwd: {
			describe: "Alter the current working directory.",
			default: process.cwd(),
		},
		debug: {
			describe: "Logs additional messages",
			default: false,
			type: "boolean",
		},
	})
	.example("eik init")
	.example("eik login --server https://assets.myserver.com --key ######")
	.example("eik publish")
	.example("eik meta my-app --server https://assets.myserver.com")
	.example(
		"eik npm-alias lit-html 1.0.0 1 --server https://assets.myserver.com --token ######",
	)
	.example(
		"eik map my-map 1.0.0 ./import-map.json --server https://assets.myserver.com --token ######",
	)
	.example("eik map-alias my-map 1.0.0 1")
	.command(commands)
	.demandCommand()
	.wrap(null)
	.version(false) // Turn off the built-in version option to not conflict with the version command
	.help()
	.parse();
