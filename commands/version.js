import { execSync } from "child_process";
import { join } from "path";
import VersionPackage from "../classes/version.js";
import json from "../utils/json/index.js";
import { EikCliError, errors } from "../utils/error.js";
import { commandHandler } from "../utils/command-handler.js";

export const command = "version [level]";

export const describe =
	'Compare local files with files on server and increment "version" field if different';

/** @type {import('yargs').CommandBuilder} */
export const builder = (yargs) => {
	return yargs
		.positional("level", {
			describe: "Semver level to increment version by",
			default: "patch",
			type: "string",
			choices: ["major", "minor", "patch"],
		})
		.options({
			dryRun: {
				alias: "d",
				describe: "Log details about the operation and skip upload",
				type: "boolean",
			},
		})
		.example("eik version")
		.example("eik version minor")
		.example("eik version --dry-run");
};

export const handler = commandHandler(
	{ command, options: ["server"] },
	async (argv, log) => {
		const {
			level,
			dryRun,
			cwd,
			name,
			version,
			server,
			map,
			out,
			files,
			configFile,
		} = argv;

		const options = {
			logger: log,
			name,
			server,
			version,
			cwd,
			level,
			map,
			out,
			files,
			configFile,
		};

		const newVersion = await new VersionPackage(options).run();

		if (dryRun) {
			log.info(
				`Dry Run: new version needed, determined new version to be ${newVersion}`,
			);
		} else {
			log.debug(`Writing new version ${newVersion} to ${configFile}`);
			// @ts-expect-error
			await json.writeEik(
				{ version: newVersion },
				{ cwd, filename: configFile },
			);

			log.debug(`Committing ${configFile} to local git repository`);
			try {
				execSync(`git add ${configFile}`, { cwd });
				log.debug(`  ==> stage: ${join(cwd, configFile)}`);
			} catch (err) {
				throw new EikCliError(
					errors.ERR_NOT_GIT,
					`Failed to stage file "${configFile}". Is this directory (or any parent directories) a git repository?`,
					err,
				);
			}

			try {
				execSync(
					`git commit -m "build(assets): version ${configFile} to v${newVersion} [skip ci]"`,
					{
						cwd,
						env: {
							GIT_AUTHOR_NAME: "Eik Cli",
							GIT_AUTHOR_EMAIL: "eik@eik.dev",
							GIT_COMMITTER_NAME: "Eik Cli",
							GIT_COMMITTER_EMAIL: "eik@eik.dev",
						},
						stdio: "ignore",
					},
				);
				log.debug(`  ==> commit`);

				log.info(`New version ${newVersion} written back to ${configFile}`);
			} catch (err) {
				throw new EikCliError(
					errors.ERR_GIT_COMMIT,
					`Failed to commit changes to file "${configFile}".`,
					err,
				);
			}
		}
	},
);
