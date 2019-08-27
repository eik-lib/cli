'use strict';

const publishBundle = require('./bundle');
const publishGlobalDependency = require('./global-dependency');

async function command(subcommands, args) {
    if (!subcommands[0]) {
        publishBundle(args);
    } else {
        publishGlobalDependency(subcommands, args);
    }
}

module.exports = command;
