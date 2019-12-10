'use strict';

const Init = require('./init');
const Alias = require('./alias');
const Meta = require('./meta');
const PublishMap = require('./publish/map');
const PublishApp = require('./publish/app/index');
const PublishDependency = require('./publish/dependency');

module.exports = {
    Init,
    Alias,
    Meta,
    publish: {
        App: PublishApp,
        Map: PublishMap,
        Dependency: PublishDependency,
    },
};
