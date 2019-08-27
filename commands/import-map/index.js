'use strict';

const del = require('./delete');
const set = require('./set');

async function command(subcommands, args) {
    if (subcommands[1] === 'delete') {
        const [type, , name] = subcommands;
        del(type, name);
    } else {
        const [type, name, value] = subcommands;
        set(type, name, value);
    }
}

module.exports = command;
