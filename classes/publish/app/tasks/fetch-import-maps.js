'use strict';

const fetch = require('node-fetch');

module.exports = class FetchImportMaps {
    async process(state = {}) {
        state.log.debug('Loading import map file from server');
        try {
            const maps = state.map.map(m =>
                fetch(m).then(r => {
                    switch (true) {
                        case r.status === 404:
                            throw new Error(
                                'Import map could not be found on server',
                            );
                        case r.status >= 400 && r.status < 500:
                            throw new Error('Server rejected client request');
                        case r.status >= 500:
                            throw new Error('Server error');
                        default:
                            return r.json();
                    }
                }),
            );
            const results = await Promise.all(maps);
            const dependencies = results.map(r => r.imports);
            // eslint-disable-next-line no-param-reassign
            state.importMap = {
                imports: Object.assign({}, ...dependencies),
            };
        } catch (err) {
            throw new Error(
                `Unable to load import map file from server: ${err.message}`,
            );
        }

        return state;
    }
};
