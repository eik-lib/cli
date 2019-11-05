'use strict';

const logger = (spinner, debug = false) => ({
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
        if (debug) spinner.info(message).start();
    },
    trace(message) {
        if (debug) spinner.info(message).start();
    },
});

module.exports = logger;
