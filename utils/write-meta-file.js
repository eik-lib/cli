'use strict';

const fs = require('fs').promises;
const { join } = require('path');

module.exports = async ({
    version,
    integrity,
    path = join(process.cwd(), '.eikrc'),
}) => {
    await fs.writeFile(
        path,
        JSON.stringify({
            version,
            integrity,
        }),
    );
};
