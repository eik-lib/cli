'use strict';

const gzip = require('gzip-size');

const getCompressedSize = data => {
    const size = gzip.sync(data);
    return size;
};

module.exports = getCompressedSize;
