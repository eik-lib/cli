import request from "../../../../utils/http/request.js";
import typeSlug from "@eik/common/lib/helpers/type-slug.js";
import { joinUrlPathname } from "../../../../utils/url.js";

import Task from "./task.js";

export default class UploadFiles extends Task {
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
			log.error("Unable to upload zip file to server");
			switch (err.statusCode) {
				case 400:
					throw new Error(
						`${err.statusCode}: Client attempted to send an invalid URL parameter`,
					);
				case 401:
					throw new Error(`${err.statusCode}: Client unauthorized with server`);
				case 404:
					throw new Error(
						`${err.statusCode}: Client could not find server route`,
					);
				case 409:
					throw new Error(
						`Package with name "${name}" and version "${version}" already exists on server`,
					);
				case 415:
					throw new Error(
						`${err.statusCode}: Client attempted to send an unsupported file format to server`,
					);
				case 502:
					throw new Error(
						`${err.statusCode}: Server was unable to write file to storage, ${err.message}`,
					);
				default:
					throw new Error(`${err.statusCode}: Server failed, ${err.message}`);
			}
		}
	}
}
