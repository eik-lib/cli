import Ping from "./ping.js";
import Alias from "./alias.js";
import Meta from "./meta.js";
import Login from "./login.js";
import PublishMap from "./publish/map.js";
import PublishPackage from "./publish/package/index.js";
import Integrity from "./integrity.js";
import Version from "./version.js";

export default {
	/**
	 * @param {import('./alias.js').AliasOptions} opts
	 */
	alias(opts) {
		return new Alias(opts).run();
	},

	/**
	 * @param {import('./integrity.js').IntegrityOptions} opts
	 */
	integrity(opts) {
		return new Integrity(opts).run();
	},

	/**
	 * Log in using a key to get a Bearer token for use with other commands.
	 *
	 * @param {import('./login.js').LoginOptions} opts
	 */
	login(opts) {
		return new Login(opts).run();
	},

	/**
	 * @param {import('./publish/map.js').PublishMapOptions} opts
	 */
	map(opts) {
		return new PublishMap(opts).run();
	},

	/**
	 * @param {import('./meta.js').MetaOptions} opts
	 */
	meta(opts) {
		return new Meta(opts).run();
	},

	/**
	 * @param {import('./ping.js').PingOptions} opts
	 */
	ping(opts) {
		return new Ping(opts).run();
	},

	/**
	 * @param {import('./publish/package/index.js').PublishOptions} opts
	 */
	publish(opts) {
		return new PublishPackage(opts).run();
	},

	/**
	 * @param {import('./version.js').VersionOptions} opts
	 */
	version(opts) {
		return new Version(opts).run();
	},
};
