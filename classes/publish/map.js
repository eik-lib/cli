import assert from "assert";
import abslog from "abslog";
import { join, parse, isAbsolute } from "path";
import { existsSync } from "fs";
import { schemas } from "@eik/common";
import { request } from "../../utils/http/index.js";
import { joinUrlPathname } from "../../utils/url.js";

/**
 * @typedef {object} PublishMapOptions
 * @property {import('abslog').AbstractLoggerOptions} [logger]
 * @property {string} server
 * @property {string} [cwd]
 * @property {string} token
 * @property {string} file
 * @property {string} name
 * @property {string} version
 */

/**
 * @typedef {object} PublishMapResult
 * @property {string} server
 * @property {string} name
 * @property {string} version
 * @property {string} type
 */

export default class PublishMap {
	/**
	 * @param {PublishMapOptions} options
	 */
	constructor({
		logger,
		cwd = process.cwd(),
		server,
		token,
		file,
		name,
		version,
	}) {
		this.log = abslog(logger);
		this.cwd = cwd;
		this.server = server;
		this.token = token;
		this.name = name;
		this.version = version;
		this.file = file;
	}

	/**
	 * @returns {Promise<PublishMapResult>}
	 */
	async run() {
		this.log.debug("Running import map publish command");

		this.log.debug("Validating input");
		parse(this.cwd);
		schemas.assert.server(this.server);
		assert(
			this.token && typeof this.token === "string",
			'Parameter "token" is not valid',
		);
		schemas.assert.name(this.name);
		schemas.assert.version(this.version);
		parse(this.file);

		this.absoluteFile = isAbsolute(this.file)
			? this.file
			: join(this.cwd, this.file);

		assert(
			existsSync(this.absoluteFile),
			'Parameter "file" is not valid. File does not exist',
		);

		this.log.debug(
			`Uploading import map "${this.name}" version "${this.version}" to asset server`,
		);
		try {
			await request({
				method: "PUT",
				host: this.server,
				pathname: joinUrlPathname("map", this.name, this.version),
				map: this.absoluteFile,
				token: this.token,
			});

			return {
				server: this.server,
				name: this.name,
				version: this.version,
				type: "map",
			};
		} catch (err) {
			const msg = "Unable to complete upload of import map to server";
			switch (err.statusCode) {
				case 400:
					throw new Error(
						`${msg}: Client attempted to send an invalid URL parameter`,
					);
				case 401:
					throw new Error(`${msg}: Client unauthorized with server`);
				case 409:
					throw new Error(
						`${msg}: Map with name "${this.name}" and version "${this.version}" already exists on server`,
					);
				case 415:
					throw new Error(
						`${msg}: Client attempted to send an unsupported file format to server`,
					);
				case 502:
					throw new Error(`${msg}: Server was unable to write file to storage`);
				default:
					throw new Error(`${msg}: Server failed`);
			}
		}
	}
}
