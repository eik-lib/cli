'use strict';

const readline = require('readline');
const ora = require('ora');
const { readFileSync } = require('fs');
const Login = require('../classes/login');
const { resolvePath, logger } = require('../utils');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// eslint-disable-next-line no-underscore-dangle
rl._writeToOutput = stringToWrite => {
    if (rl.hidden) {
        if (stringToWrite.includes(rl.text)) {
            const input = stringToWrite.replace(rl.text, '');
            const safe = input.replace(/./g, '*');
            rl.output.write(`${rl.text}${safe}`);
        } else {
            rl.output.write('*');
        }
    } else {
        rl.output.write(stringToWrite);
    }
};

const question = (text, hidden) => {
    rl.hidden = !!hidden;
    rl.text = text;
    return new Promise(resolve => {
        rl.question(text, resolve);
    });
};

exports.command = 'login';

exports.aliases = [];

exports.describe = `Authenticate against asset server`;

exports.builder = yargs => {
    const assetsPath = resolvePath('./assets.json').pathname;
    const assets = JSON.parse(readFileSync(assetsPath));

    yargs.options({
        server: {
            alias: 's',
            describe: 'Specify location of asset server.',
            default: assets.server || '',
        },
    });
};

exports.handler = async argv => {
    const username = await question('username: ');
    const password = await question('password: ', true);

    let success = false;
    const spinner = ora().start();
    try {
        success = await new Login({
            logger: logger(spinner),
            username,
            password,
            ...argv,
        }).run();
    } catch (err) {
        logger.warn(err.message);
    }

    if (success) {
        spinner.succeed('🤘');
    } else {
        spinner.fail('🥺');
        process.exit(1);
    }
};
