export const errors = {
	ERR_MISSING_CONFIG: "ERR_MISSING_CONFIG",
	ERR_WRONG_TYPE: "ERR_WRONG_TYPE",
	ERR_VERSION_EXISTS: "ERR_VERSION_EXISTS",
	ERR_NOT_GIT: "ERR_NOT_GIT",
	ERR_GIT_COMMIT: "ERR_GIT_COMMIT",
};

export class EikCliError extends Error {
	#errorCode;
	#exitCode;

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

		switch (errorCode) {
			case errors.ERR_VERSION_EXISTS:
				this.#exitCode = 0;
				break;
			default:
				this.#exitCode = 1;
		}
	}

	/** @type {Error | undefined} */
	get cause() {
		return this.cause;
	}

	get errorCode() {
		return this.#errorCode;
	}

	get exitCode() {
		return this.#exitCode;
	}
}
