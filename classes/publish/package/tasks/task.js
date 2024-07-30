import abslog from 'abslog';

export default class Task {
    constructor(options) {
        this.cwd = options.cwd;
        this.log = abslog(options.logger);
        this.path = options.path;
        this.config = options.config;
    }
}
