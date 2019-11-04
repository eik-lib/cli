#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const yargs = require('yargs');
const boxen = require('boxen');
const { join } = require('path');
const { readFileSync } = require('fs');
const classes = require('./classes');

const runningAsScript = !module.parent;

module.exports = classes;

if (runningAsScript) {
    const { version } = JSON.parse(
        readFileSync(join(__dirname, './package.json')),
    );
    const greeting = chalk.white.bold(`Asset Pipe CLI (v${version})`);

    const boxenOptions = {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
        backgroundColor: '#555555',
    };
    const msgBox = boxen(greeting, boxenOptions);

    // eslint-disable-next-line no-console
    console.log(msgBox);

    // eslint-disable-next-line no-unused-expressions
    yargs
        .scriptName('asset-pipe')
        .commandDir('commands')
        .demandCommand()
        .wrap(150)
        .version(false)
        .help().argv;
}
