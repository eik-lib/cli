import { join } from "path";
import chalk from "chalk";
import PublishPackage from "../classes/publish/package/publish.js";
import typeSlug from "@eik/common/lib/helpers/type-slug.js";
import typeTitle from "../utils/type-title.js";
import Artifact from "../formatters/artifact.js";
import { EikCliError, errors } from "../utils/error.js";
import { commandHandler } from "../utils/command-handler.js";

export const command = "publish";

export const aliases = ["pkg", "package", "pub"];

export const describe = "Publish an app package to an Eik server";

/** @type {import('yargs').CommandBuilder} */
export const builder = (yargs) => {
	return yargs
		.options({
			dryRun: {
				alias: "d",
				describe: "Log details about the operation and skip upload",
				type: "boolean",
			},
			token: {
				describe: "JWT used for authentication, if not using eik login",
				type: "string",
				alias: "t",
			},
		})
		.example("eik publish")
		.example("eik publish --dry-run")
		.example("eik publish --token yourtoken");
};

export const handler = commandHandler(
	{ command, options: ["server"] },
	async (argv, log, spinner) => {
		const {
			debug,
			dryRun,
			cwd,
			token,
			name,
			version,
			server,
			map,
			out,
			files,
			type,
			configFile,
		} = argv;

		if (type === "map") {
			throw new EikCliError(
				errors.ERR_WRONG_TYPE,
				'"type" is set to "map", which is not supported by the publish command. Please use the "eik map" command instead',
			);
		}

		const options = {
			logger: log,
			cwd,
			token,
			dryRun,
			debug,
			name,
			server,
			version,
			type,
			map,
			out,
			files,
		};

		const publish = await new PublishPackage(options).run();

		if (!publish) {
			throw new EikCliError(
				errors.ERR_VERSION_EXISTS,
				`Version in ${configFile} has not changed since last publish, publishing is not necessary`,
			);
		}

		const { files: fls } = publish;

		if (!dryRun) {
			let url = new URL(join(typeSlug(type), name), server);
			let res = await fetch(url);
			const pkgMeta = await res.json();

			url = new URL(join(typeSlug(type), name, version), server);
			res = await fetch(url);
			const pkgVersionMeta = await res.json();

			const artifact = new Artifact(pkgMeta);
			artifact.versions = [pkgVersionMeta];

			spinner.text = "";
			spinner.stopAndPersist();

			artifact.format(server);
			process.stdout.write("\n");
		} else {
			spinner.text = "";
			spinner.stopAndPersist();

			process.stdout.write(
				`:: ${chalk.bgYellow.white.bold(
					typeTitle(type),
				)} > ${chalk.green(name)} | ${chalk.bold("dry run")}`,
			);
			process.stdout.write("\n\n");
			process.stdout.write("   files (local temporary):\n");
			for (const file of fls) {
				process.stdout.write(`   - ${chalk.bold("type")}: ${file.type}\n`);
				process.stdout.write(
					`     ${chalk.bold("path")}: ${file.pathname}\n\n`,
				);
			}
			process.stdout.write(
				`   ${chalk.bold("No files were published to remote server")}\n\n`,
			);
		}
	},
);
