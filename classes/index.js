'use strict';

const Ping = require('./ping');
const Alias = require('./alias');
const Meta = require('./meta');
const Login = require('./login');
const PublishMap = require('./publish/map');
const PublishPackage = require('./publish/package/index');
const PublishNPM = require('./publish/npm');
const Integrity = require('./integrity');
const Version = require('./version');

module.exports = {
    Ping,
    Alias,
    Meta,
    Login,
    Integrity,
    Version,
    publish: {
        Package: PublishPackage,
        Map: PublishMap,
        NPM: PublishNPM,
    },
};
