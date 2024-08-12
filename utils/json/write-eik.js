import fs from 'node:fs/promises';
import { join } from 'path';

/**
 * Reads, updates and then writes data to given eik.json file (defaults to file in current directory)
 *
 * @param {object} data - data to write to eik.json file
 * @param {{cwd: string, filename: string}} options - additional options
 *
 * @returns {Promise<undefined>}
 *
 * @example json.writeEik({ key: 'value' });
 * @example json.writeEik({ key: 'value' }, { cwd: '/path/to/cwd' });
 * @example json.writeEik({ key: 'value' }, { cwd: '/path/to/cwd', filename: 'eik.json' });
 */
export default async (data = {}, options) => {
    const { cwd = process.cwd(), filename = 'eik.json' } = options;
    const eikpath = join(cwd, filename);
    const eik = await fs.readFile(eikpath, 'utf-8');
    const eikjson = JSON.parse(eik);

    await fs.writeFile(
        eikpath,
        JSON.stringify(
            {
                ...eikjson,
                ...data,
            },
            null,
            2,
        ),
    );
};
