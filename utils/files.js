/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */

'use strict';

const { join, isAbsolute, basename } = require('path');
const glob = require('glob');

const calculateParentDir = (files) => {
    const res = files.slice(1).reduce((ps, file) => {
        if (!file.match(/^([A-Za-z]:)?\/|\\/)) {
            throw new Error('relative path without a basedir');
        }

        const xs = file.split(/\/+|\\+/);
        let i = 0;
        for (i = 0; ps[i] === xs[i] && i < Math.min(ps.length, xs.length); i++);
        return ps.slice(0, i);
    }, files[0].split(/\/+|\\+/));

    // Windows correctly handles paths with forward-slashes
    return res.length > 1 ? res.join('/') : '/';
};

const globP = (path) => {
    return new Promise((res, rej) =>
        glob(path, (err, f) => {
            if (err) {
                rej(err);
                return;
            }
            res(f);
        }),
    );
}

module.exports = async (files, path, options = {}) => {
    const cwd = options.cwd || process.cwd();
    const fileMap = new Map();
    for (const [key, val] of Object.entries(files)) {
        const pathSrc = isAbsolute(val) ? val : join(cwd, val);
        const fls = await globP(pathSrc);

        for (const file of fls) {
            const segments = key.split('/');
            const last = segments[segments.length - 1];
            if (last.includes('.')) {
                if (fls.length > 1) {
                    throw new Error(
                        'Cannot specify a single file destination for multiple source files',
                    );
                }
                fileMap.set(file, join(path, key));
            } else {
                const commonBase = calculateParentDir(fls);
                if (commonBase !== file) {
                    const bname = file.replace(commonBase, '');
                    fileMap.set(file, join(path, key, bname));
                } else {
                    fileMap.set(file, join(path, key, basename(file)));
                }
            }
        }
    }
    return fileMap;
}