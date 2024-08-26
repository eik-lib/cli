export const errors = {
	ERR_MISSING_CONFIG: "ERR_MISSING_CONFIG",
};

export class EikCliError extends Error {
	#errorCode;
	#exitCode = 1;

	/**
	 * @param {string} errorCode
	 * @param {string} message
	 * @param {Error} [cause]
	 */
	constructor(errorCode, message, cause) {
		super(message);

		this.name = "EikCliError";
		this.cause = cause;

		this.#errorCode = errorCode;
	}

	get errorCode() {
		return this.#errorCode;
	}

	get exitCode() {
		return this.#exitCode;
	}
}
