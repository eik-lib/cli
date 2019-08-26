'use strict';

const alias = require('./alias');
const name = require('./name');
const organisation = require('./organisation');
const server = require('./server');
const subtype = require('./subtype');
const type = require('./type');
const version = require('./version');
const semverType = require('./semver-type');
const uriOrVersionOrAlias = require('./uri-or-version-or-alias');
const inputs = require('./inputs');

module.exports = {
    alias,
    name,
    organisation,
    server,
    subtype,
    type,
    version,
    semverType,
    uriOrVersionOrAlias,
    inputs,
};
