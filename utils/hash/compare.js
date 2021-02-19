'use strict';

/**
 * Compares 2 hash strings for comparison. Returns `true` if hashes are identical, false otherwise.
 *
 * @param {string} hash1 - first hash string to compare
 * @param {string} hash2 - second hash string to compare
 *
 * @returns {boolean}
 *
 * @example hash.compare('a1b22c23d24e25f4g33a123b23c34', 'a1b22c23d24e25f4g33a123b23c34');
 */
module.exports = (hash1, hash2) => hash1 === hash2;
