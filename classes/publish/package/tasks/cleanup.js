import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { rimraf } from 'rimraf';
import Task from './task.js';

export default class Cleanup extends Task {
    async process() {
        const { log, path } = this;
        log.debug('Cleaning up');

        if (existsSync(path)) {
            const dir = await readdir(path);
            await Promise.all(
                dir
                    .filter((file) => file !== 'integrity.json')
                    .map((file) => rimraf(join(path, file))),
            );
        }
    }
}
