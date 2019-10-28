#!/usr/bin/env node

'use strict';

const ora = require('ora');
const chalk = require('chalk');
const boxen = require('boxen');
const { join } = require('path');
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

        const { version } = require(join(__dirname, './package.json'));
        const greeting = chalk.white.bold(`Asset Pipe CLI (v${version})`);

        const boxenOptions = {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green',
            backgroundColor: '#555555'
        };
        const msgBox = boxen(greeting, boxenOptions);

        console.log(msgBox);

        const spinner = (this.spinner = ora().start());
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
        try {
            this.assets = require(this.pathname);
        } catch (err) {
            this.logger.debug('No "assets.json" file found in cwd');
        }

        const validation = schemas.assets(this.assets);
        if (this.assets && validation.error) {
            this.logger.error(`Invalid 'assets.json' file`);
            for (const { dataPath, message } of validation.error) {
                this.logger.warn(`${dataPath} ${message}`);
            }

            this.spinner.fail('🥺');
            process.exit(1);
        }

        if (this.command === 'init') {
            const Init = commands.init;
            const success = await new Init({ logger: this.logger }).run();
            if (success) {
                this.spinner.succeed('🤘');
            } else {
                this.spinner.fail('🥺');
            }
            process.exit(0);
        }

        if (this.command === 'version') {
            const Version = commands.version;
            const success = await new Version({
                logger: this.logger,
                level: this.subcommands[0]
            }).run();
            if (success) {
                this.spinner.succeed('🤘');
            } else {
                this.spinner.fail('🥺');
            }
            process.exit(0);
        }

        if (this.command === 'alias') {
            if (!this.assets) {
                this.logger.error(
                    'Alias command requires "assets.json" file to be present in cwd'
                );
                this.spinner.fail('🥺');
                process.exit(1);
            }
            const Alias = commands.alias;
            const success = await new Alias({
                logger: this.logger,
                server: this.assets.server,
                org: this.assets.organisation,
                name: this.subcommands[0],
                version: this.subcommands[1],
                alias: this.subcommands[2]
            }).run();

            if (success) {
                this.spinner.succeed('🤘');
            } else {
                this.spinner.fail('🥺');
            }
        }

        if (this.command === 'publish') {
            if (!this.subcommands[0]) {
                if (!this.assets) {
                    this.logger.error(
                        'publish command requires "assets.json" file to be present in cwd'
                    );
                    this.spinner.fail('🥺');
                    process.exit(1);
                }
                const Publish = commands.publish;
                const success = await new Publish({
                    logger: this.logger,
                    server: this.assets.server,
                    org: this.assets.organisation,
                    name: this.assets.name,
                    version: this.assets.version,
                    map: this.assets['import-map'],
                    js: this.assets.js.input,
                    css: this.assets.css.input,
                    dryRun: this.args.dryRun
                }).run();
                if (success) {
                    this.spinner.succeed('🤘');
                } else {
                    this.spinner.fail('🥺');
                }
            } else {
                const Publish = commands.globalPublish;
                const success = await new Publish({
                    logger: this.logger,
                    server: this.args.server || this.assets.server,
                    org: this.args.org || this.assets.organisation,
                    map: this.args.map || this.assets['import-map'],
                    name: this.subcommands[0],
                    version: this.subcommands[1],
                    dryRun: this.args.dryRun
                }).run();
                if (success) {
                    this.spinner.succeed('🤘');
                } else {
                    this.spinner.fail('🥺');
                }
            }
        }

        if (this.command === 'map') {
            const UploadImportMap = commands.uploadImportMap;
            const success = await new UploadImportMap({
                logger: this.logger,
                server: this.args.server || this.assets.server,
                org: this.args.org || this.assets.organisation,
                file: this.subcommands[2],
                name: this.subcommands[0],
                version: this.subcommands[1]
            }).run();
            if (success) {
                this.spinner.succeed('🤘');
            } else {
                this.spinner.fail('🥺');
            }
        }
    }
}

if (runningAsScript) {
    const { command, subcommands, args } = parseInput();
    new Main({ command, subcommands, args })
        .run()
        .catch(err => console.error(err));
}
