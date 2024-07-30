/**
 * Creates a logger object that wraps an instance of the "ora" module in order to provide consistent command line logging that includes a spinner
 *
 * @param {object} spinner
 * @param {boolean} debug
 */
const logger = (spinner, debug = false) => ({
    /**
     * @param {string} message
     */
    fatal(message) {
        spinner.fail(message).start();
    },
    /**
     * @param {string} message
     */
    error(message) {
        spinner.fail(message).start();
    },
    /**
     * @param {string} message
     */
    warn(message) {
        spinner.warn(message).start();
    },
    /**
     * @param {string} message
     */
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
    /**
     * @param {string} message
     */
    debug(message) {
        if (debug) spinner.info(message).start();
    },
    /**
     * @param {string} message
     */
    trace(message) {
        if (debug) spinner.info(message).start();
    },
});

export default logger;
