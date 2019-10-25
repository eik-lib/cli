#!/usr/bin/env node

'use strict';

const ora = require('ora');
const { schemas } = require('@asset-pipe/common');
const commands = require('./commands');
const { parseInput, resolvePath } = require('./utils');

const runningAsScript = !module.parent;

module.exports = commands;

class Main {
    constructor({ command, subcommands, args } = {}) {
        this.command = command;
        this.subcommands = subcommands;
        this.args = args;
        this.pathname = resolvePath('./assets.json').pathname;

        const spinner = ora().start();
        this.logger = {
            fatal() {},
            error(message) {
                spinner.fail(message).start();
            },
            warn(message) {
                spinner.warn(message).start();
            },
            info(message) {
                spinner.succeed(message).start();
            },
            debug(message) {
                spinner.info(message).start();
            },
            trace(message) {
                spinner.info(message).start();
            }
        };
    }

    async run() {
        if (this.command === 'init') {
            const Init = commands.init;
            new Init({ logger: this.logger }).run();
            process.exit(0);
        }

        if (this.command === 'version') {
            const Version = commands.version;
            new Version({
                logger: this.logger,
                level: this.subcommands[0]
            }).run();
            process.exit(0);
        }

        try {
            this.assets = require(this.pathname);
        } catch (err) {
            this.logger.error('Failed to read assets.json. Does file exist?');
            this.logger.warn(err.message);
            process.exit(1);
        }

        const validation = schemas.assets(this.assets);
        if (validation.error) {
            this.logger.error(`Invalid 'assets.json' file`);
            for (const { dataPath, message } of validation.error) {
                this.logger.warn(`${dataPath} ${message}`);
            }

            process.exit(1);
        }

        if (this.command === 'alias') {
            const Alias = commands.alias;
            await new Alias({
                logger: this.logger,
                server: this.assets.server,
                org: this.assets.organisation,
                name: this.subcommands[0],
                version: this.subcommands[1],
                alias: this.subcommands[2]
            }).run();

            process.exit(0);
        }

        if (this.command === 'publish') {
            if (!this.subcommands[0]) {
                const Publish = commands.publish;
                await new Publish({
                    logger: this.logger,
                    server: this.assets.server,
                    org: this.assets.organisation,
                    name: this.assets.name,
                    version: this.assets.version,
                    js: this.assets.js.input,
                    css: this.assets.css.input,
                    dryRun: this.args.dryRun
                }).run();
            } else {
                const Publish = commands.publishGlobalDependency;
                await new Publish({ logger }).run();
            }
            process.exit(0);
        }

        try {
            const cleanCmd = this.command.replace(/[.\/]/gi, '');
            commands[cleanCmd](this.subcommands, args);
        } catch (err) {
            console.error('Invalid command', err);
        }
    }
}

if (runningAsScript) {
    const { command, subcommands, args } = parseInput();
    new Main({ command, subcommands, args })
        .run()
        .then(() => console.log('wtf is happening?'))
        .catch(err => console.error(err));
}
