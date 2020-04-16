'use strict';

const { join } = require('path');
const { sendCommand } = require('../../../../utils');

module.exports = class UploadFiles {
    async process(state = {}) {
        const { log, server, token, name, nextVersion, zipFile } = state;
        log.debug('Uploading zip file to server');
        try {
            const { message } = await sendCommand({
                method: 'PUT',
                host: server,
                pathname: join(
                    'pkg',
                    encodeURIComponent(name),
                    nextVersion,
                ),
                file: zipFile,
                token,
            });

            log.debug(`:: pkg ${message.name} v${message.version}`);
            log.debug(`   scope:     ${message.org}`);
            log.debug(`   integrity: ${message.integrity}`);
            log.debug(`   files:`);

            if (message.files) {
                for (const file of message.files) {
                    log.debug(`   ==> pathname:  ${file.pathname}`);
                    log.debug(`       mimeType:  ${file.mimeType}`);
                    log.debug(`       type:      ${file.type}`);
                    log.debug(`       size:      ${file.size}`);
                    log.debug(`       integrity: ${file.integrity}`);
                }
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
                        `Package with name "${name}" and version "${nextVersion}" already exists on server`,
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
