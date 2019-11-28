'use strict';

const { join } = require('path');
const { sendCommand } = require('../../../../utils');

module.exports = class UploadFiles {
    async process(state = {}) {
        const { log, server, org, name, version, zipFile } = state;
        log.debug('Uploading zip file to server');
        try {
            const { message } = await sendCommand({
                method: 'PUT',
                host: server,
                pathname: join(org, 'pkg', name, version),
                file: zipFile,
            });

            log.debug(
                `  Org: ${message.org}, Name: ${message.name}, Version: ${message.version}`,
            );
            for (const file of message.files) {
                log.debug(`  ==> ${JSON.stringify(file)}`);
            }
        } catch (err) {
            log.error('Unable to upload zip file to server');
            switch (err.statusCode) {
                case 400:
                    throw new Error(
                        'Client attempted to send an invalid URL parameter',
                    );
                case 401:
                    throw new Error('Client unauthorized with server');
                case 409:
                    throw new Error(
                        `Package with name "${name}" and version "${version}" already exists on server`,
                    );
                case 415:
                    throw new Error(
                        'Client attempted to send an unsupported file format to server',
                    );
                case 502:
                    throw new Error(
                        'Server was unable to write file to storage',
                    );
                default:
                    throw new Error('Server failed');
            }
        }
        return state;
    }
};
