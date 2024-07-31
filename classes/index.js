import Ping from './ping.js';
import Alias from './alias.js';
import Meta from './meta.js';
import Login from './login.js';
import PublishMap from './publish/map.js';
import PublishPackage from './publish/package/index.js';
import Integrity from './integrity.js';
import Version from './version.js';

export default {
    ping(opts) {
        return new Ping(opts).run();
    },

    alias(opts) {
        return new Alias(opts).run();
    },

    meta(opts) {
        return new Meta(opts).run();
    },

    login(opts) {
        return new Login(opts).run();
    },

    integrity(opts) {
        return new Integrity(opts).run();
    },

    version(opts) {
        return new Version(opts).run();
    },

    publish(opts) {
        return new PublishPackage(opts).run();
    },

    map(opts) {
        return new PublishMap(opts).run();
    },
};
