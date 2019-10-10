'use strict';

const fs = require('fs');
const ora = require('ora');
const { resolvePath } = require('../utils');

async function command() {
    console.log('');
    console.log('✨', 'Asset Pipe Init', '✨');
    console.log('');

    const checkAssetsFileSpinner = ora(
        'Checking for existence of assets.json file in current directory'
    ).start();

    const { pathname } = resolvePath('./assets.json');

    try {
        const st = fs.statSync(pathname);
        if (st.isFile()) {
            checkAssetsFileSpinner.succeed(
                'assets.json file already exists in current directory'
            );
            return;
        }
    } catch (err) {}

    fs.writeFileSync(
        pathname,
        JSON.stringify(
            {
                organisation: '[required]',
                name: '[required]',
                version: '1.0.0',
                server: 'http://assets-server.svc.prod.finn.no',
                js: {
                    input: '[path to js entrypoint]',
                    options: {},
                },
                css: {
                    input: '[path to css entrypoint]',
                    options: {},
                },
            },
            null,
            2
        )
    );
    checkAssetsFileSpinner.succeed(
        'assets.json file created in current directory'
    );
}

module.exports = command;
