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
        if (typeof message !== 'string') {
            // eslint-disable-next-line no-param-reassign
            spinner.text = '';
            spinner.stopAndPersist();
            // eslint-disable-next-line no-console
            console.log(message);
            spinner.start();
        } else {
            spinner.succeed(message).start();
        }
    },
    debug(message) {
        if (debug) spinner.info(message).start();
    },
    trace(message) {
        if (debug) spinner.info(message).start();
    },
});

module.exports = logger;
