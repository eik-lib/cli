#!/usr/bin/env node
import chalk from 'chalk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import boxen from 'boxen';
import { join } from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { commands } from './commands/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { version } = JSON.parse(
    readFileSync(join(__dirname, './package.json'), { encoding: 'utf-8' }),
);

// short circuit and provide a -v and --version flag
if (
    process.argv.includes('-v') ||
    // last position only to avoid conflict with publish command
    process.argv[process.argv.length - 1].includes('--version')
) {
    console.log(version);
    process.exit(0);
}

const greeting = chalk.white.bold(`Eik CLI (v${version})`);

const boxenOptions = {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'green',
    backgroundColor: '#555555',
};
const msgBox = boxen(greeting, boxenOptions);

console.log(msgBox);

yargs(hideBin(process.argv))
    .example('eik init')
    .example('eik login --server https://assets.myserver.com --key ######')
    .example('eik publish')
    .example('eik meta my-app --server https://assets.myserver.com')
    .example(
        'eik npm-alias lit-html 1.0.0 1 --server https://assets.myserver.com --token ######',
    )
    .example(
        'eik map my-map 1.0.0 ./import-map.json --server https://assets.myserver.com --token ######',
    )
    .example('eik map-alias my-map 1.0.0 1')
    .command(commands)
    .demandCommand()
    .wrap(150)
    .version(false)
    .help()
    .parse();
