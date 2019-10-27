'use strict';

const init = require('./init');
const version = require('./version');
const importMap = require('./import-map');
const publish = require('./publish');
const alias = require('./alias');

module.exports = {
    init,
    version,
    uploadImportMap: importMap.upload,
    publish: publish.publish,
    globalPublish: publish.publishGlobalDependency,
    alias
};
