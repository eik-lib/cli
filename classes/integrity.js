import abslog from "abslog";
import eik from "@eik/common";
import { typeSlug } from "../utils/index.js";
import { joinUrlPathname } from "../utils/url.js";

const { schemas } = eik;

/**
 * @typedef {object} IntegrityOptions
 * @property {import('abslog').AbstractLoggerOptions} [logger]
 * @property {string} server
 * @property {"package" | "npm" | "map"} [type="package"]
 * @property {string} name
 * @property {string} version
 * @property {string} [cwd]
 * @property {boolean} [debug]
 */

export default class Integrity {
	/**
	 *
	 * @param {IntegrityOptions} options
	 */
	constructor({
		logger,
		name,
		version,
		server,
		type,
		debug = false,
		cwd = process.cwd(),
	}) {
		this.log = abslog(logger);
		this.server = server;
		this.name = name;
		this.version = version;
		this.debug = debug;
		this.cwd = cwd;
		this.type = type;
	}

	async run() {
		this.log.debug("Validating input");

		try {
			this.log.debug(`  ==> server: ${this.server}`);
			schemas.assert.server(this.server);

			this.log.debug(`  ==> name: ${this.name}`);
			schemas.assert.name(this.name);

			this.log.debug(`  ==> version: ${this.version}`);
			schemas.assert.version(this.version);

			this.log.debug(`  ==> type: ${this.type}`);
			schemas.assert.type(this.type || null);

			this.log.debug(`  ==> debug: ${this.debug}`);
			if (typeof this.debug !== "boolean") {
				// @ts-expect-error
				throw new schemas.ValidationError(`Parameter "debug" is not valid`);
			}

			this.log.debug(`  ==> cwd: ${this.cwd}`);
			if (typeof this.cwd !== "string") {
				// @ts-expect-error
				throw new schemas.ValidationError(`Parameter "cwd" is not valid`);
			}
		} catch (err) {
			throw new Error(`Unable to validate input to command: ${err.message}`);
		}

		this.log.debug("Requesting meta information from asset server");
		try {
			const url = new URL(
				joinUrlPathname(typeSlug(this.type), this.name, this.version),
				this.server,
			);
			this.log.debug(`  ==> url: ${url}`);

			const res = await fetch(url);

			if (res.ok) {
				this.log.debug(`  ==> ok: true`);
				return await res.json();
			}

			this.log.debug(`  ==> ok: false`);

			if (res.status === 400) {
				throw new Error("Client attempted to send an invalid URL parameter");
			}

			if (res.status === 401) {
				throw new Error("Client unauthorized with server");
			}

			throw new Error("Server Error");
		} catch (err) {
			throw new Error(
				`Unable to retrieve meta information for package: ${err.message}`,
			);
		}
	}
}
