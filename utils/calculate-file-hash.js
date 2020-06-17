'use strict';

const ssri = require('ssri');
const fs = require('fs');

module.exports = async path => {
    const integrity = await ssri.fromStream(fs.createReadStream(path));
    return integrity.toString();
}