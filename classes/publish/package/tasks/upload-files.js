/* eslint-disable no-param-reassign */

'use strict';

const { join } = require('path');
const { typeSlug } = require('@eik/common-utils');
const { request } = require('../../../../utils/http');
const Task = require('./task');

module.exports = class UploadFiles extends Task {
    async process(zipFile) {
        const { log } = this;
        const { server, name, version, type, token } = this.config;
        log.debug('Uploading zip file to server');
        try {
            const pathname = join(
                typeSlug(type),
                encodeURIComponent(name),
                version,
            );

            const { message } = await request({
                method: 'PUT',
                host: server,
                pathname,
                file: zipFile,
                token,
            });

            return message;
        } catch (err) {
            log.error('Unable to upload zip file to server');

            switch (err.statusCode) {
                case 400:
                    throw new Error(
                        'Client attempted to send an invalid URL parameter',
                    );
                case 401:
                    throw new Error('Client unauthorized with server');
                case 404:
                    throw new Error('Client could not find server route');
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
                    throw new Error(err.message);
            }
        }
    }
};
