import abslog from "abslog";
import assert from "@eik/common/lib/schemas/assert.js";

/**
 * @typedef {object} PingOptions
 * @property {string} [server]
 * @property {import('abslog').AbstractLoggerOptions} [logger]
 */

export default class Ping {
	/**
	 * @param {PingOptions} options
	 */
	constructor({ logger, server } = {}) {
		this.log = abslog(logger);
		this.server = server;
	}

	/**
	 * Run the ping command
	 * @returns {Promise<boolean>}
	 */
	async run() {
		this.log.debug("Validating input");

		try {
			assert.server(this.server);
		} catch (err) {
			this.log.error(err.message);
			return false;
		}

		this.log.debug("Requesting ping from server");
		try {
			const result = await fetch(/** @type {string}*/ (this.server));

			if (!result.ok) {
				const err = new Error("Ping unsuccessful");
				// @ts-expect-error
				err.statusCode = result.status;
				throw err;
			}

			this.log.info(`Ping successful`);
			return true;
		} catch (err) {
			if (err.code === "ENOTFOUND") {
				this.log.info("Ping unsuccessful. Server not found.");
				return false;
			}

			switch (err.statusCode) {
				case 404:
					this.log.info("Ping unsuccessful. Route not found.");
					return false;
				default:
					this.log.warn("Ping unsuccessful. Unknown server error");
					return false;
			}
		}
	}
}
