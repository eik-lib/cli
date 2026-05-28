import request from "../../../../utils/http/request.js";
import typeSlug from "@eik/common/lib/helpers/type-slug.js";
import { joinUrlPathname } from "../../../../utils/url.js";

import Task from "./task.js";

export default class UploadFiles extends Task {
	/** @param {string} zipFile */
	async process(zipFile) {
		const { log } = this;
		const { server, name, version, type, token } = this.config;
		log.debug("Uploading zip file to server");
		try {
			const pathname = joinUrlPathname(
				typeSlug(type),
				encodeURIComponent(name),
				version,
			);

			const { message } = await request({
				method: "PUT",
				host: server,
				pathname,
				file: zipFile,
				token,
			});

			return message;
		} catch (err) {
			const e = /** @type {any} */ (err);
			log.error("Unable to upload zip file to server");
			switch (e.statusCode) {
				case 400:
					throw new Error(
						`${e.statusCode}: Client attempted to send an invalid URL parameter`,
						{ cause: err },
					);
				case 401:
					throw new Error(`${e.statusCode}: Client unauthorized with server`, {
						cause: err,
					});
				case 404:
					throw new Error(
						`${e.statusCode}: Client could not find server route`,
						{ cause: err },
					);
				case 409:
					throw new Error(
						`Package with name "${name}" and version "${version}" already exists on server`,
						{ cause: err },
					);
				case 415:
					throw new Error(
						`${e.statusCode}: Client attempted to send an unsupported file format to server`,
						{ cause: err },
					);
				case 502:
					throw new Error(
						`${e.statusCode}: Server was unable to write file to storage, ${e.message}`,
						{ cause: err },
					);
				default:
					throw new Error(`${e.statusCode}: Server failed, ${e.message}`, {
						cause: err,
					});
			}
		}
	}
}
