'use strict';

const { join } = require('path');
const homedir = require('os').homedir();
const { readFileSync } = require('fs');

function readJSONSync(path) {
    try {
        return JSON.parse(readFileSync(path));
    } catch (err) {
        return {};
    }
}

/**
 * Sets up and returns an object containing a set of default values for the app context.
 * Default values are fetched from the app's eik.json file as well as from .eikrc, if present in the users home directory.
 *
 * @param {string} cwd The current working directory
 * 
 * @returns {{server:string,token:string,js:string|object,css:string|object,version:string,map:Array,name:string,out:string,cwd:string}}
 */
module.exports = function getDefaults(cwd) {
    const pkgJSON = readJSONSync(join(cwd, './package.json'));
    const eikJSON = readJSONSync(join(cwd, './eik.json'));
    const eikrc = readJSONSync(join(homedir, './.eikrc'));

    if (eikJSON.name && pkgJSON.eik) {
        throw new Error('Eik configuration was defined in both in package.json and eik.json. You must specify one or the other.');
    }

    const assets = { name: pkgJSON.name, version: pkgJSON.version, ...pkgJSON.eik, ...eikJSON };

    const tokens = new Map(eikrc.tokens);

    let server;
    // if user is logged into a single asset server
    if (tokens.size === 1) {
        server = tokens.keys().next().value;
    }

    // server value in eik.json or package.json always takes presedence
    if (assets.server) {
        server = assets.server;
    }

    const token = tokens.get(server);

    return {
        server: server || undefined,
        token: token || undefined,
        files: assets.files || undefined,
        version: assets.version || undefined,
        map: assets['import-map'] || [],
        name: assets.name || undefined,
        out: assets.out || '.eik',
        cwd,
    }
}