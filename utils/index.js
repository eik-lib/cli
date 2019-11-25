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
const fetchRemoteHash = require('./fetch-remote-hash');
const incrementSemverVersion = require('./increment-semver-version');

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
    fetchRemoteHash,
    incrementSemverVersion,
};
