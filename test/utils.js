'use strict';

const mockLogger = () => {
    const logs = {
        fatal: '',
        error: '',
        warn: '',
        info: '',
        debug: '',
        trace: ''
    };
    const logger = {
        fatal(msg) {
            logs.fatal += msg;
        },
        error(msg) {
            logs.error += msg;
        },
        warn(msg) {
            logs.warn += msg;
        },
        info(msg) {
            logs.info += msg;
        },
        debug(msg) {
            logs.debug += msg;
        },
        trace(msg) {
            logs.trace += msg;
        }
    };
    return { logs, logger };
};

module.exports.mockLogger = mockLogger;
