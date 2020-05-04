'use strict';

const fs = require('fs').promises;
const { join } = require('path');

module.exports = async (meta = {}, {
    cwd = process.cwd(),
    filename = '.eikrc',
}) => {
    await fs.writeFile(
        join(cwd, filename),
        JSON.stringify(meta),
    );
};
