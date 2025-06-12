import assert from "assert";
import abslog from "abslog";
import schemasAssert from "@eik/common/lib/schemas/assert.js";
import { type as validateType } from "@eik/common/lib/validators/type.js";
import { alias as validateAlias } from "@eik/common/lib/validators/alias.js";
import request from "../utils/http/request.js";
import typeSlug from "@eik/common/lib/helpers/type-slug.js";
import { joinUrlPathname } from "../utils/url.js";

/**
 * @typedef {object} AliasOptions
 * @property {import('abslog').AbstractLoggerOptions} [logger]
 * @property {string} server
 * @property {"package" | "npm" | "image" | "map"} [type="package"]
 * @property {string} name
 * @property {string} version
 * @property {string} alias
 * @property {string} token
 */

/**
 * @typedef {object} AliasResult
 * @property {string} server
 * @property {string} type
 * @property {string} name
 * @property {string} alias
 * @property {string} version
 * @property {boolean} update
 * @property {string[]} files
 * @property {string} org
 * @property {string} integrity
 */

export default class Alias {
	/**
	 * @param {AliasOptions} options
	 */
	constructor({ logger, server, token, type, name, version, alias }) {
		this.log = abslog(logger);
		this.server = server;
		this.token = token;
		this.type = typeSlug(type);
		this.name = name;
		this.alias = alias;
		this.version = version;
	}

	/**
	 * @returns {Promise<AliasResult>}
	 */
	async run() {
		const data = {
			server: this.server,
			type: this.type,
			name: this.name,
			alias: this.alias,
			version: this.version,
			update: false,
			files: [],
			org: "",
			integrity: "",
		};

		this.log.debug("Validating command input");
		schemasAssert.server(this.server);
		schemasAssert.name(this.name);
		schemasAssert.version(this.version);
		validateType(this.type);
		validateAlias(this.alias);
		assert(
			this.token && typeof this.token === "string",
			`Parameter "token" is not valid`,
		);

		this.log.debug(
			`Requesting creation of ${this.type} alias "v${this.alias}" for ${this.name} v${this.version} on ${this.server}`,
		);

		const pathname = joinUrlPathname(this.type, this.name, `v${this.alias}`);
		try {
			const { message } = await request({
				host: this.server,
				method: "PUT",
				pathname,
				data: { version: this.version },
				token: this.token,
			});

			data.org = message.org || "";
			data.integrity = message.integrity || "";
			data.version = message.version || this.version;
			data.name = message.name || this.name;
			data.files = message.files || [];

			return data;
		} catch (err) {
			let status = err.statusCode;

			if (status === 409) {
				this.log.debug("Alias already exists on server, performing update");

				try {
					const { message: msg } = await request({
						host: this.server,
						method: "POST",
						pathname,
						data: { version: this.version },
						token: this.token,
					});

					data.org = msg.org || "";
					data.integrity = msg.integrity || "";
					data.version = msg.version || this.version;
					data.name = msg.name || this.name;
					data.files = msg.files || [];
					data.update = true;

					return data;
				} catch (error) {
					status = error.statusCode;
				}
			}

			switch (status) {
				case 400:
					throw new Error("Client attempted to send an invalid URL parameter");
				case 401:
					throw new Error("Client unauthorized with server");
				case 404:
					throw new Error(
						`The server was unable to locate ${pathname}. Ensure you have the correct package type (eik package-alias vs eik npm-alias), name and that the version exists on the server.`,
					);
				case 409:
					throw new Error(
						`${this.type} with name "${this.name}" and version "${this.version}" already exists on server`,
					);
				case 415:
					throw new Error(
						"Client attempted to send an unsupported file format to server",
					);
				case 502:
					throw new Error("Server was unable to write file to storage");
				default:
					throw new Error("Server failure");
			}
		}
	}
}
