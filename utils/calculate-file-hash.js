'use strict';

const crypto = require('crypto');
const fs = require('fs');
const { pipeline } = require('stream');

module.exports = path =>
    new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha512');
        const file = fs.createReadStream(path);

        pipeline(file, hash, error => {
            if (error) return reject(error);
            return resolve(`sha512-${hash.digest('base64')}`);
        });
    });
