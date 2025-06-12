import { copyFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, isAbsolute, parse } from "node:path";
import abslog from "abslog";
import inc from "semver/functions/inc.js";
import EikConfig from "@eik/common/lib/classes/eik-config.js";
import ValidationError from "@eik/common/lib/schemas/validation-error.js";
import typeSlug from "@eik/common/lib/helpers/type-slug.js";
import integrity from "../utils/http/integrity.js";
import hashFile from "../utils/hash/file.js";
import hashFiles from "../utils/hash/files.js";
import hashCompare from "../utils/hash/compare.js";

/**
 * @typedef {object} VersionOptions
 * @property {import('abslog').AbstractLoggerOptions} [logger]
 * @property {string} server
 * @property {"package" | "npm" | "map"} [type="package"]
 * @property {string} name
 * @property {string} version
 * @property {import("semver").ReleaseType} [level="patch"]
 * @property {string} cwd
 * @property {string[]} [map]
 * @property {string} [out="./.eik"]
 * @property {string | Record<string, string>} files
 * @property {string} [configFile="eik.json"]
 */

export default class Version {
	/**
	 * @param {VersionOptions} options
	 */
	constructor({
		logger,
		server,
		type = "package",
		name,
		version,
		level = "patch",
		cwd,
		map = [],
		out = "./.eik",
		files,
		configFile = "eik.json",
	}) {
		const config = new EikConfig(
			{
				server,
				type,
				name,
				version,
				"import-map": map,
				out,
				files,
			},
			null,
			cwd,
		);

		this.log = abslog(logger);
		this.config = config;
		this.configFile = configFile;
		this.path = isAbsolute(config.out) ? config.out : join(cwd, config.out);
		this.level = level;
	}

	/**
	 * Similar to `npm version`, but updates `eik.json`
	 * @returns {Promise<string | null>} The new version number, or null if the versioning failed
	 */
	async run() {
		const { name, server, type, version, cwd, out, files, map } = this.config;
		const { log, level, path, configFile } = this;
		log.debug("Validating input");

		log.debug(`  ==> config object`);
		this.config.validate();

		log.debug(`  ==> cwd: ${cwd}`);
		parse(cwd);

		log.debug(`  ==> level: ${level}`);
		if (!["major", "minor", "patch"].includes(level)) {
			throw new ValidationError('Parameter "version" is not valid');
		}

		log.debug(`  ==> files: ${JSON.stringify(files)}`);
		if (!files) {
			throw new ValidationError('Parameter "files" is not valid');
		}

		log.debug(`  ==> map: ${JSON.stringify(map)}`);
		if (!Array.isArray(map)) {
			throw new ValidationError('Parameter "map" is not valid');
		}

		log.debug("Checking local package version");
		log.debug(`Current local package version determined to be ${version}`);
		log.debug(`Fetching remote package metadata from ${server}`);

		let integrityHash;
		try {
			integrityHash = await integrity(server, typeSlug(type), name, version);
		} catch (err) {
			throw new Error(
				`Unable to fetch package metadata from server: ${err.message}`,
			);
		}

		if (!integrityHash) {
			// version does not exist on server yet. No increment needed.
			throw new Error(
				`The current version of this package has not yet been published, version change is not needed.`,
			);
		}

		log.debug("Hashing local files for comparison with server");

		let localHash;
		try {
			mkdirSync(path, { recursive: true });
			const eikPathDest = join(path, configFile);
			const eikJSON = {
				name,
				server,
				files,
				"import-map": map,
				out,
			};
			writeFileSync(eikPathDest, JSON.stringify(eikJSON, null, 2));

			const localFiles = [eikPathDest];
			log.debug(`  ==> ${eikPathDest} (hash: ${await hashFile(eikPathDest)})`);

			if (files) {
				try {
					const mappings = await this.config.mappings();

					for (const mapping of mappings) {
						const destination = join(path, mapping.destination.filePathname);
						copyFileSync(mapping.source.absolute, destination);
						const hash = await hashFile(destination);
						log.debug(`  ==> ${destination} (hash: ${hash})`);
						localFiles.push(destination);
					}
				} catch (err) {
					// throw new Error(`Failed to zip JavaScripts: ${err.message}`);
				}
			}
			localHash = await hashFiles(localFiles);
		} catch (err) {
			throw new Error(
				`Unable to hash local files for comparison: ${err.message}`,
			);
		}

		log.debug(`Comparing hashes:`);
		log.debug(`  ==> local: ${localHash}`);
		log.debug(`  ==> remote: ${integrityHash}`);
		const same = hashCompare(integrityHash, localHash);

		if (same) {
			throw new Error(
				`The current version of this package already contains these files, version change is not needed.`,
			);
		}

		log.debug(`Incrementing by "${level}" level`);
		const newVersion = inc(version, level);
		log.debug(`  ==> ${newVersion}`);
		return newVersion;
	}
}
