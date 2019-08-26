#!/usr/bin/env node

'use strict';

const commands = require('./commands');
const { parseInput } = require('./utils');

const runningAsScript = !module.parent;

module.exports = commands;

if (runningAsScript) {
    const { command, subcommands, args } = parseInput();

    try {
        const cleanCmd = command.replace(/[.\/]/gi, '');
        commands[cleanCmd](subcommands, args);
    } catch (err) {
        console.error('Invalid command', err);
    }
}
