import { join } from "node:path";
import { fetchWithRetry } from "./retry.js";

/**
 * Fetches package integrity string by name and version from a given Eik asset server.
 *
 * @param {string} server - Eik asset server URL to perform lookup against
 * @param {string} type - Package type (pkg, npm, map)
 * @param {string} name - Package name to lookup
 * @param {string} version - Semver major version to lock fetch to
 *
 * @returns {Promise<string|null>} - Package integrity string
 *
 * @throws Error
 */
/**
 * @param {string} server
 * @param {string} type
 * @param {string} name
 * @param {string} version
 * @param {{ retries?: number, retryDelay?: number }} [options]
 */
export default async (
	server,
	type,
	name,
	version,
	{ retries, retryDelay } = {},
) => {
	const url = new URL(join(type, name, version), server);
	url.search = `?t=${Date.now()}`;

	const res = await fetchWithRetry(() => fetch(url), {
		maxRetries: retries !== undefined ? retries + 1 : undefined,
		baseDelayMs: retryDelay,
	});

	if (!res.ok) {
		if (res.status === 404) {
			return null;
		}
		throw new Error("Server responded with non 200 status code.");
	}

	try {
		const body = await res.json();
		return body.integrity;
	} catch (err) {
		throw new Error(
			"An error occurred while attempting to parse json response from server.",
			{ cause: err },
		);
	}
};
