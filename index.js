#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const boxen = require('boxen');
const { join } = require('path');
const classes = require('./classes');

const runningAsScript = !module.parent;

module.exports = classes;

if (runningAsScript) {
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

    require('yargs')
        .commandDir('commands')
        .demandCommand()
        .wrap(150)
        .version(false)
        .help().argv;
}
