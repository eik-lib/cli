'use strict';

const { join } = require('path');
const homedir = require('os').homedir();
const { readFileSync, existsSync } = require('fs');
const resolvePath = require('./resolve-path');

module.exports = function getDefaults(cwd) {
    try {
        // read eik.json in current dir
        const assetsPath = resolvePath('./eik.json', cwd).pathname;
        const assetsFile = existsSync(assetsPath) ? readFileSync(assetsPath) : '{}';
        const assets = JSON.parse(assetsFile);
        
        // read .eikrc in users home directory
        const eikPath = join(homedir, '.eikrc');
        const eikFile = existsSync(eikPath) ? readFileSync(eikPath) : '{}';
        const meta = JSON.parse(eikFile);
        const tokens = new Map(meta.tokens);
        
        let server;
        // if user is logged into a single asset server
        if (tokens.size === 1) {
            server = tokens.keys().next().value;
        }
        
        // server value in eik.json always takes presedence
        if (assets.server) {
            server = assets.server;
        }

        const token = tokens.get(server);
        
        return {
            server: server || undefined, 
            token: token || undefined, 
            js: assets.js && assets.js.input || undefined,
            css: assets.css && assets.css.input || undefined,
            major: assets.major || undefined,
            map: assets['import-map'] || [],
            name: assets.name || undefined,
            cwd,
        }
    } catch (err) {
        return {}
    }
}