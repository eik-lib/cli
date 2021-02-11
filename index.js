#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const yargs = require('yargs');
const boxen = require('boxen');
const { join } = require('path');
const { readFileSync } = require('fs');

const { version } = JSON.parse(
    readFileSync(join(__dirname, './package.json')),
);
const greeting = chalk.white.bold(`Eik CLI (v${version})`);

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
    .example('eik init')
    .example('eik login --server https://assets.myserver.com --key ######')
    .example('eik publish')
    .example('eik meta my-app --server https://assets.myserver.com')
    .example('eik npm-alias lit-html 1.0.0 1 --server https://assets.myserver.com --token ######')
    .example('eik map my-map 1.0.0 ./import-map.json --server https://assets.myserver.com --token ######')
    .example('eik map-alias my-map 1.0.0 1')
    .commandDir('commands')
    .demandCommand()
    .wrap(150)
    .version(false)
    .help().argv;
