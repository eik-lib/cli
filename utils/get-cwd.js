'use strict';

const av = require('yargs-parser')(process.argv.slice(2));

module.exports = function getCWD() {
    return av.cwd || av.c || process.cwd();
}