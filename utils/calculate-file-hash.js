'use strict';

const crypto = require('crypto');
const fs = require('fs');

module.exports = path =>
    new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha512');
        const rs = fs.createReadStream(path);
        rs.on('error', reject);
        rs.on('data', chunk => hash.update(chunk));
        rs.on('end', () => resolve(hash.digest('base64')));
    });
