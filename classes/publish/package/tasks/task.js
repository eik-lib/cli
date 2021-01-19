'use strict';

const abslog = require('abslog');

module.exports = class Task {
    constructor(logger, config) {
        this.log = abslog(logger);
        this.config = config;
    }
}