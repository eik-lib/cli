'use strict';

const abslog = require('abslog');

module.exports = class Task {
    constructor(logger) {
        this.log = abslog(logger);
    }
}