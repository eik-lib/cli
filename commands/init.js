import { join } from "path";
import fs from "fs";
import { commandHandler } from "../utils/command-handler.js";

const command = "init";

const aliases = ["i"];

const describe = "Create an eik.json file";

/** @type {import('yargs').CommandBuilder} */
const builder = (yargs) => {
	return yargs
		.options({
			server: {
				alias: "s",
				describe: "Eik server address, if different from configuration file",
			},
			version: {
				alias: "v",
				describe:
					'Specify the semver version field in "eik.json". Eg. --version 1.0.0',
				default: "1.0.0",
			},
			name: {
				alias: "n",
				describe:
					'Specify the app name field in "eik.json". Eg. --name my-great-app',
			},
		})
		.example("eik init")
		.example(
			"eik init --server https://assets.myserver.com --version 2.0.0 --name my-app",
		);
};

const handler = commandHandler(
	async (argv, log) => {
		let { cwd, server, name, version } = argv;

		const pathname = join(cwd, "./eik.json");
		log.debug(`Checking for existing ${pathname}`);

		let eikJsonExists = false;
		try {
			const st = fs.statSync(pathname);
			if (st.isFile()) {
				eikJsonExists = true;
			}
		} catch (err) {
			// noop
		}
		if (eikJsonExists) {
			throw new Error(
				`An "eik.json" file already exists in directory. File will not be written`,
			);
		}

		if (!name || !version || version === "1.0.0") {
			log.debug("Looking for default from package.json");
			try {
				let packageJson = fs.readFileSync(join(cwd, "package.json"), "utf-8");
				packageJson = JSON.parse(packageJson);
				if (!name) {
					name = packageJson.name;
					log.debug(`Using ${name} from package.json as default name`);
				}
				if (!version || version === "1.0.0") {
					version = packageJson.version;
					log.debug(`Using ${version} from package.json as default version`);
				}
			} catch (e) {
				// noop
			}
		} else {
			log.debug(`Got ${name} and ${version}, skipping package.json`);
		}

		log.debug(`Writing to ${pathname}`);

		const output = JSON.stringify(
			{
				$schema:
					"https://raw.githubusercontent.com/eik-lib/common/main/lib/schemas/eikjson.schema.json",
				name,
				version,
				server,
				files: "./public",
				"import-map": [],
			},
			null,
			2,
		);
		fs.writeFileSync(pathname, output);

		log.info(`Wrote to ${pathname}

${output}

Read more about configuring Eik on https://eik.dev/docs/reference/eik-json`);
	},
	{
		init: true,
	},
);

export { command, aliases, describe, builder, handler };
