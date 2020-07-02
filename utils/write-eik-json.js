'use strict';

const fs = require('fs').promises;
const { join } = require('path');

module.exports = async (data = {}, {
    cwd = process.cwd(),
    filename = 'eik.json',
}) => {
    const eikpath = join(cwd, filename);
    const eik = await fs.readFile(eikpath);
    const eikjson = JSON.parse(eik);

    await fs.writeFile(
        eikpath,
        JSON.stringify({
            ...eikjson,
            ...data,
        }, null, 2),
    );
};