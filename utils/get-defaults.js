'use strict';

const { join } = require('path');
const homedir = require('os').homedir();
const { readFileSync, existsSync } = require('fs');

/**
 * Sets up and returns an object containing a set of default values for the app context.
 * Default values are fetched from the app's eik.json file as well as from .eikrc, if present in the users home directory.
 *
 * @param {string} cwd The current working directory
 * 
 * @returns {{server:string,token:string,js:string|object,css:string|object,version:string,map:Array,name:string,out:string,cwd:string}}
 */
module.exports = function getDefaults(cwd) {
    try {
        // read eik.json in current dir
        const assetsPath = join(cwd, './eik.json');
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
            js: assets.js || undefined,
            css: assets.css || undefined,
            version: assets.version || undefined,
            map: assets['import-map'] || [],
            name: assets.name || undefined,
            out: assets.out || '.eik',
            cwd,
        }
    } catch (err) {
        return {}
    }
}