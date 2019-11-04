'use strict';

const os = require('os');
const { join } = require('path');
const { readFileSync, writeFileSync } = require('fs');
const abslog = require('abslog');
const { validators } = require('@asset-pipe/common');
const { sendCommand } = require('../utils');

module.exports = class Login {
    constructor({ logger, server, username, password } = {}) {
        this.log = abslog(logger);
        this.server = server;
        this.username = username;
        this.password = password;
    }

    async run() {
        this.log.debug('Logging in');

        try {
            validators.origin(this.server);
        } catch (err) {
            this.log.error(`Parameter "server" is not valid`);
            return false;
        }

        if (
            !this.username ||
            typeof this.username !== 'string' ||
            this.username.length < 1
        ) {
            this.log.error(`Parameter "username" is not valid`);
            return false;
        }

        if (
            !this.password ||
            typeof this.password !== 'string' ||
            this.password.length < 1
        ) {
            this.log.error(`Parameter "password" is not valid`);
            return false;
        }

        this.log.debug('Requesting login from asset server');
        try {
            const { token } = await sendCommand({
                host: this.server,
                method: 'POST',
                pathname: 'login',
                data: { username: this.username, password: this.password },
            });

            if (token) {
                const homedir = os.homedir();
                const aprcPath = join(homedir, '.asset-piperc');
                let aprc;
                try {
                    aprc = JSON.parse(readFileSync(aprcPath));
                } catch (err) {
                    aprc = {};
                }
                aprc.token = token;
                writeFileSync(aprcPath, JSON.stringify(aprc));
            } else {
                return false;
            }
        } catch (err) {
            this.log.error('Unable to login to server');
            this.log.warn(err.message);

            return false;
        }

        return true;
    }
};
