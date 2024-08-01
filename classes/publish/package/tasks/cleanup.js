import { join } from 'path';
import fs from 'fs';
import { rimrafSync } from 'rimraf';
import Task from './task.js';

export default class Cleanup extends Task {
    async process() {
        const { log, path } = this;
        log.debug('Cleaning up');

        if (fs.existsSync(path)) {
            fs.readdirSync(path)
                .filter((file) => file !== 'integrity.json')
                .forEach((file) => rimrafSync(join(path, file)));
        }
    }
}
