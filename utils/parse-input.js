'use strict';

const yargs = require('yargs');

function parseInput() {
    const argv = yargs.argv;
    const { _, $0, ...args } = argv;
    const [command, ...subcommands] = _;

    return { command, subcommands, args };
}

module.exports = parseInput;
