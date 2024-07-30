import yargs from 'yargs-parser';

const av = yargs(process.argv.slice(2));

/**
 * Returns the current working directory path
 * If a --cwd or -c command line flag has been used, the value given will be returned
 * Otherwise, the directory where the process was run from is used
 *
 * @returns {string}
 */
export default function getCWD() {
    return av.cwd || av.c || process.cwd();
}
