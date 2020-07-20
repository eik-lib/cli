'use strict';

const sendCommand = require('./send-command');
const logger = require('./logger');
const calculateFileHash = require('./calculate-file-hash');
const calculateFilesHash = require('./calculate-files-hash');
const compareHashes = require('./compare-hashes');
const fetchLatestVersion = require('./fetch-latest-version');
const fetchPackageMeta = require('./fetch-package-meta');
const incrementSemverVersion = require('./increment-semver-version');
const compressedSize = require('./compressed-size');
const getDefaults = require('./get-defaults');
const getCWD = require('./get-cwd');

module.exports = {
    sendCommand,
    logger,
    calculateFileHash,
    calculateFilesHash,
    compareHashes,
    fetchLatestVersion,
    fetchPackageMeta,
    incrementSemverVersion,
    compressedSize,
    getDefaults,
    getCWD,
};
