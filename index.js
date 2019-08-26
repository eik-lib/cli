#!/usr/bin/env node

'use strict';

const yargs = require('yargs');
const commands = require('./commands');

const runningAsScript = !module.parent;

module.exports = commands;

function parseInput() {
    const argv = yargs.argv;
    const { _, $0, ...args } = argv;
    const [command, ...subcommands] = _;

    return { command, subcommands, args };
}

if (runningAsScript) {
    const { command, subcommands, args } = parseInput();

    try {
        const cleanCmd = command.replace(/[.\/]/gi, '');
        commands[cleanCmd](subcommands, args);
    } catch (err) {
        console.error('Invalid command', err);
    }
}
