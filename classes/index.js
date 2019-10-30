'use strict';

const init = require('./init');
const version = require('./version');
const mapUpload = require('./map/upload');
const publishApp = require('./publish/app');
const publishDependency = require('./publish/dependency');
const alias = require('./alias');

module.exports = {
    init,
    version,
    alias,
    map: {
        upload: mapUpload
    },
    publish: {
        app: publishApp,
        dependency: publishDependency
    }
};
