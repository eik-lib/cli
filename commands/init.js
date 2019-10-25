'use strict';

const fs = require('fs');
const abslog = require('abslog');
const { resolvePath } = require('../utils');

module.exports = class Init {
    constructor({
        logger,
        cwd,
        org = '[required]',
        name = '[required]',
        version = '1.0.0',
        server = 'http(s)://[assets-server.url]',
        inputs = {
            js: { input: '[path to js entrypoint]', options: {} },
            css: { input: '[path to css entrypoint]', options: {} }
        }
    } = {}) {
        this.cwd = cwd;
        this.log = abslog(logger);
        this.pathname = resolvePath('./assets.json', this.cwd).pathname;
        this.org = org;
        this.name = name;
        this.version = version;
        this.server = server;
        this.inputs = inputs;
    }

    run() {
        this.log.debug('checking for the existence of an assets.json file');

        try {
            const st = fs.statSync(this.pathname);
            if (st.isFile()) {
                this.log.warn('assets.json file already exists');
                this.log.info('✨ done ✨');
                return;
            }
        } catch (err) {}

        fs.writeFileSync(
            this.pathname,
            JSON.stringify(
                {
                    organisation: this.org,
                    name: this.name,
                    version: this.version,
                    server: this.server,
                    inputs: this.inputs
                },
                null,
                2
            )
        );
        this.log.debug('assets.json file created in current directory');
        this.log.info('✨ done ✨');
    }
};
