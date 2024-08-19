import { join } from "node:path";

/**
 * A version of path.join that replaces \ (win32) with /
 * @param  {...string} parts
 * @returns {string}
 */
export function joinUrlPathname(...parts) {
	return join(...parts).replace(/\\/g, "/");
}
