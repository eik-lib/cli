'use strict';

const resolvePath = require('./resolve-path');
const readAssetsJson = require('./read-assets-json');
const sendCommand = require('./send-command');
const parseInput = require('./parse-input');
const logger = require('./logger');
const calculateFileHash = require('./calculate-file-hash');
const calculateFilesHash = require('./calculate-files-hash');
const compareHashes = require('./compare-hashes');
const fetchLatestVersion = require('./fetch-latest-version');
const fetchPackageMeta = require('./fetch-package-meta');
const incrementSemverVersion = require('./increment-semver-version');
const writeMetaFile = require('./write-meta-file');

module.exports = {
    resolvePath,
    readAssetsJson,
    sendCommand,
    parseInput,
    logger,
    calculateFileHash,
    calculateFilesHash,
    compareHashes,
    fetchLatestVersion,
    fetchPackageMeta,
    incrementSemverVersion,
    writeMetaFile,
};
