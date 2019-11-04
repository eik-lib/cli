'use strict';

const path = require('path');

function resolvePath(pathname, cwd = process.cwd()) {
    let pname = pathname;
    if (!path.isAbsolute(pathname)) {
        pname = path.normalize(`${cwd}/${pathname}`);
    }

    const { dir, base: file } = path.parse(pathname);
    return { dir, file, pathname: pname };
}

module.exports = resolvePath;
