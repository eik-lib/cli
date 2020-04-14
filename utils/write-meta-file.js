'use strict';

const fs = require('fs').promises;
const { join } = require('path');

module.exports = async ({
    version,
    token,
    integrity,
    development = { js: '', css: '' },
}, {
    cwd = process.cwd(),
    filename = '.eikrc',
}) => {
    await fs.writeFile(
        join(cwd, filename),
        JSON.stringify({
            version,
            integrity,
            development,
            token,
        }),
    );
};
