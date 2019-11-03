'use strict';

const Init = require('./init');
const Version = require('./version');
const Alias = require('./alias');
const PublishMap = require('./publish/map');
const PublishApp = require('./publish/app');
const PublishDependency = require('./publish/dependency');

module.exports = {
    Init,
    Version,
    Alias,
    publish: {
        App: PublishApp,
        Map: PublishMap,
        Dependency: PublishDependency
    }
};
