'use strict';

const semver = require('semver');

module.exports = (version, increment) => {
    if (!semver.valid(version)) {
        throw new Error(
            'Invalid semver given. Argument must be of the form x.x.x. Eg. 1.0.0',
        );
    }
    if (!['major', 'minor', 'patch'].includes(increment)) {
        throw new Error(
            `Invalid incrementation level given. Argument must be one of 'major', 'minor' or 'patch'`,
        );
    }
    return semver.inc(version, increment);
};
