'use strict';

const abslog = require('abslog');

module.exports = class Task {
    constructor(options) {
        this.cwd = options.cwd;
        this.log = abslog(options.logger);
        this.path = options.path;
        this.config = options.config;
    }
}