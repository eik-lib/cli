/* eslint-disable import/no-unresolved */

'use strict';

import scrollIntoView from 'scroll-into-view-if-needed';

const main = () => {
    // eslint-disable-next-line no-undef
    const node = document.getElementById('hero');

    scrollIntoView(node, {
        scrollMode: 'if-needed',
        block: 'nearest',
        inline: 'nearest',
    });
};

main();
