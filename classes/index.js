'use strict';

const Ping = require('./ping');
const Alias = require('./alias');
const Meta = require('./meta');
const Login = require('./login');
const PublishMap = require('./publish/map');
const PublishPackage = require('./publish/package/index');
const Integrity = require('./integrity');
const Version = require('./version');

module.exports = {
    ping(opts) {
        return new Ping(opts).run();
    },

    alias(opts) {
        return new Alias(opts).run();
    },

    meta(opts) {
        return new Meta(opts).run();
    },

    login(opts) {
        return new Login(opts).run();
    },

    integrity(opts) {
        return new Integrity(opts).run();
    },

    version(opts) {
        return new Version(opts).run();
    },

    publish(opts) {
        return new PublishPackage(opts).run();
    },

    map(opts) {
        return new PublishMap(opts).run();
    },
};
