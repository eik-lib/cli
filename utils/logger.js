'use strict';

const logger = spinner => ({
    fatal() {},
    error(message) {
        spinner.fail(message).start();
    },
    warn(message) {
        spinner.warn(message).start();
    },
    info(message) {
        spinner.succeed(message).start();
    },
    debug(message) {
        spinner.info(message).start();
    },
    trace(message) {
        spinner.info(message).start();
    }
});

module.exports = logger;
