#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { join } from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

import * as alias from "./commands/alias.js";
import * as init from "./commands/init.js";
import * as integrity from "./commands/integrity.js";
import * as login from "./commands/login.js";
import * as mapAlias from "./commands/map-alias.js";
import * as map from "./commands/map.js";
import * as meta from "./commands/meta.js";
import * as npmAlias from "./commands/npm-alias.js";
import * as packageAlias from "./commands/package-alias.js";
import * as ping from "./commands/ping.js";
import * as publish from "./commands/publish.js";
import * as version from "./commands/version.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { version: cliVersion } = JSON.parse(
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
	console.log(cliVersion);
	process.exit(0);
}

await yargs(hideBin(process.argv))
	.scriptName("eik")
	// inspired by git
	.usage(
		`usage: $0 [-v | --version] [-h | --help] [-c <path> | --config <path>]
           [--cwd <path>] [--debug] <command> [<args>]`,
	)
	.epilogue(
		`Run $0 <command> --help to read more about a specific subcommand.

For a more detailed description of commands and options, see the reference documentation:
  https://eik.dev/cli`,
	)
	.options({
		config: {
			alias: "c",
			describe: "Path to Eik configuration file",
		},
		cwd: {
			describe: "Path to a different working directory than the current",
		},
		debug: {
			describe: "Show additional logs",
			type: "boolean",
		},
	})
	.command([
		alias,
		init,
		integrity,
		login,
		map,
		mapAlias,
		meta,
		npmAlias,
		packageAlias,
		ping,
		publish,
		version,
	])
	.demandCommand()
	.wrap(null)
	.version(false) // Turn off the built-in version option to not conflict with the version command
	.help()
	.alias("h", "help")
	.parseAsync();
