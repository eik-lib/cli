/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-undef */

import React from 'react';
import ReactDOM from 'react-dom';

function main() {
    const domContainer = document.querySelector('#container');
    ReactDOM.render(
        React.createElement(
            'button',
            { 
                onClick: () => {
                    document.querySelector('#success').innerHTML = 'true';
                }
            },
            'Like'
        ),
        domContainer
    );
}

main();
