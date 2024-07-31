/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
import abslog from 'abslog';
import { join } from 'path';
import { schemas } from '@eik/common';

const types = ['pkg', 'map', 'npm'];

export default class Meta {
    constructor({ logger, server, name, version } = {}) {
        this.log = abslog(logger);
        this.server = server;
        this.name = name;
        this.version = version;
    }

    async run() {
        this.log.debug('Validating input');

        try {
            schemas.assert.server(this.server);
        } catch (err) {
            this.log.error(err.message);
            return false;
        }

        this.log.debug('Requesting meta information from asset server');
        try {
            const typeFetches = [];
            for (const type of types) {
                const url = new URL(join(type, this.name), this.server);
                url.search = `?t=${Date.now()}`;
                typeFetches.push(fetch(url));
            }

            const responses = await Promise.all(typeFetches);

            const data = {};

            for (const res of responses) {
                if (res.ok) {
                    const { versions, type, name, org } = await res.json();
                    data[type] = {
                        versions: Object.values(versions),
                        type,
                        name,
                        org,
                    };

                    const vers = new Map(versions);
                    data[type].versions = Array.from(vers.values());
                    for (let i = 0; i < data[type].versions.length; i++) {
                        const { version } = data[type].versions[i];
                        const url = new URL(
                            join(type, name, version),
                            this.server,
                        );

                        const resp = await fetch(url);
                        const meta = await resp.json();

                        data[type].versions[i] = {
                            ...data[type].versions[i],
                            ...meta,
                        };
                    }
                }

                if (res.status === 400) {
                    this.log.warn(
                        'Client attempted to send an invalid URL parameter',
                    );
                    return false;
                }

                if (res.status === 401) {
                    this.log.warn('Client unauthorized with server');
                    return false;
                }
            }

            return data;
        } catch (err) {
            this.log.error('Unable to retrieve meta information for package');
            this.log.warn(err.message);
            return false;
        }
    }
}
