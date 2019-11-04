'use strict';

const fs = require('fs');
const abslog = require('abslog');
const { resolvePath } = require('../utils');

module.exports = class Init {
    constructor({
        logger,
        cwd = process.cwd(),
        org = '',
        name = '',
        version = '1.0.0',
        server = '',
        js = '',
        css = '',
    } = {}) {
        this.cwd = cwd;
        this.log = abslog(logger);
        this.pathname = resolvePath('./assets.json', this.cwd).pathname;
        this.org = org;
        this.name = name;
        this.version = version;
        this.server = server;
        this.js = { input: js, options: {} };
        this.css = { input: css, options: {} };
    }

    async run() {
        this.log.debug('Running init command');

        this.log.debug('checking for the existence of an assets.json file');
        try {
            const st = fs.statSync(this.pathname);
            if (st.isFile()) {
                this.log.warn('"assets.json" file already exists');
                return true;
            }
        } catch (err) {
            // noop
        }

        try {
            fs.writeFileSync(
                this.pathname,
                JSON.stringify(
                    {
                        organisation: this.org,
                        name: this.name,
                        version: this.version,
                        server: this.server,
                        js: this.js,
                        css: this.css,
                    },
                    null,
                    2,
                ),
            );
        } catch (err) {
            this.log.error('Unable to save "assets.json" file');
            this.log.warn(err.message);
            return false;
        }
        this.log.debug(
            `assets.json file created and saved to "${this.pathname}"`,
        );

        this.log.debug('Init command complete');
        return true;
    }
};
