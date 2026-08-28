/**
 * Wraps a fetch call with retry logic for transient server errors (5xx).
 * 404 responses are returned immediately without retry — they indicate the
 * resource does not exist, not a transient failure.
 *
 * @param {() => Promise<Response>} fn - Function that performs the fetch call
 * @param {object} [options]
 * @param {number} [options.maxRetries=3] - Maximum number of attempts
 * @param {number} [options.baseDelayMs=500] - Base delay between retries in ms; doubles each attempt
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(
	fn,
	{ maxRetries = 3, baseDelayMs = 500 } = {},
) {
	let lastErr;
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		let res;
		try {
			res = await fn();
		} catch (err) {
			// Network-level failure (ECONNRESET, ENOTFOUND, etc.)
			lastErr = err;
			if (attempt < maxRetries) {
				await delay(baseDelayMs * attempt);
				continue;
			}
			throw err;
		}

		// 5xx — transient server error, retry
		if (res.status >= 500 && attempt < maxRetries) {
			await delay(baseDelayMs * attempt);
			continue;
		}

		return res;
	}
	throw lastErr;
}

/** @param {number} ms */
function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
