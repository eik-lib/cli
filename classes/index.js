'use strict';

const init = require('./init');
const version = require('./version');
const alias = require('./alias');
const publishMap = require('./publish/map');
const publishApp = require('./publish/app');
const publishDependency = require('./publish/dependency');

module.exports = {
    init,
    version,
    alias,
    publish: {
        app: publishApp,
        map: publishMap,
        dependency: publishDependency
    }
};
