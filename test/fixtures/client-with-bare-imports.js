/* eslint-disable no-undef */
// @ts-nocheck
import scrollIntoView from 'scroll-into-view-if-needed';

const main = () => {
    scrollIntoView(node, {
        scrollMode: 'if-needed',
        block: 'nearest',
        inline: 'nearest',
    });
};

main();
