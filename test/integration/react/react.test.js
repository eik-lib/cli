/* eslint-disable no-param-reassign */

'use strict';

const fs = require('fs').promises;
const os = require('os');
const { join } = require('path');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const { test, beforeEach, afterEach } = require('tap');
const fastify = require('fastify');
const EikService = require('@eik/service');
const { sink } = require('@eik/core');

const {
    Login,
    publish: { Package, NPM, Map: IMap },
    Alias,
} = require('../../..');

beforeEach(async (done, t) => {
    const memSink = new sink.MEM();
    const server = fastify({ logger: false });
    const service = new EikService({ customSink: memSink });
    server.register(service.api());
    const address = await server.listen();
    const cwd = await fs.mkdtemp(join(os.tmpdir(), 'foo-'));

    const token = await new Login({
        server: address,
        key: 'change_me',
    }).run();

    // publish @pika/react
    await new NPM({
        server: address,
        token,
        cwd,
        name: '@pika/react',
        version: '16.13.1',
    }).run();

    // create import map
    let map = {
        imports: {
            react: new URL('/npm/@pika/react/v16/index.js', address).href,
        },
    };
    await fs.writeFile(join(cwd, 'import-map.json'), JSON.stringify(map));

    await new IMap({
        cwd,
        server: address,
        name: 'my-map',
        version: '1.0.0',
        file: join(cwd, 'import-map.json'),
        token,
    }).run();

    // alias import map
    await new Alias({
        server: address,
        type: 'map',
        name: 'my-map',
        version: '1.0.0',
        alias: '1',
        token,
        cwd,
    }).run();

    // publish @pika/react-dom using import map to map react
    await new NPM({
        server: address,
        token,
        cwd,
        name: '@pika/react-dom',
        version: '16.13.1',
        map: [new URL('/map/my-map/v1', address).href],
    }).run();

    // alias react and react-dom
    await new Alias({
        server: address,
        type: 'npm',
        name: '@pika/react',
        version: '16.13.1',
        alias: '16',
        token,
        cwd,
    }).run();

    await new Alias({
        server: address,
        type: 'npm',
        name: '@pika/react-dom',
        version: '16.13.1',
        alias: '16',
        token,
        cwd,
    }).run();

    // update import map with react-dom
    map = {
        imports: {
            react: new URL('/npm/@pika/react/v16/index.js', address).href,
            'react-dom': new URL('/npm/@pika/react-dom/v16/index.js', address)
                .href,
        },
    };
    await fs.writeFile(join(cwd, 'import-map.json'), JSON.stringify(map));

    // create import map
    await new IMap({
        cwd,
        server: address,
        name: 'my-map',
        version: '1.0.1',
        file: join(cwd, 'import-map.json'),
        token,
    }).run();

    // alias import map
    await new Alias({
        server: address,
        type: 'map',
        name: 'my-map',
        version: '1.0.1',
        alias: '1',
        token,
        cwd,
    }).run();

    // publish app build using import map
    const pkg = await new Package({
        cwd,
        server: address,
        name: 'my-app',
        entrypoints: {
            './index.js': join(__dirname, './client.js'),
        },
        map: [new URL('/map/my-map/v1', address).href],
        token,
    }).run();

    t.context.version = pkg.version;
    t.context.address = address;
    t.context.server = server;
    done();
});

afterEach(async (done, t) => {
    await t.context.server.close();
    done();
});

test('react esm bundle used in app', async (t) => {
    const js = new URL(
        `/pkg/my-app/${t.context.version}/main/index.js`,
        t.context.address,
    ).href;

    const server = fastify({ logger: false });
    server.get('/', async (request, reply) => {
        reply.type('text/html');
        return `
            <html>
                <head>
                    <script src="${js}" type="module"></script>
                </head>
                <body>
                    <div id="container"></div>
                    <div id="success"></div>
                </body>
            </html>
        `;
    });
    const address = await server.listen();

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(new URL(`/`, address).href);
    const button = await page.$('button');
    await button.click();
    const html = await page.$eval('#success', (el) => el.innerHTML);
    await browser.close();

    const res = await fetch(js);
    const text = await res.text();

    t.equal(html, 'true');
    t.match(
        text,
        new URL('/npm/@pika/react/v16/index.js', t.context.address).href,
    );
    t.match(
        text,
        new URL('/npm/@pika/react-dom/v16/index.js', t.context.address).href,
    );

    await server.close();
});

test('react ie11 bundle used in app', async (t) => {
    const js = new URL(
        `/pkg/my-app/${t.context.version}/ie11/index.js`,
        t.context.address,
    ).href;

    const server = fastify({ logger: false });

    server.get('/', async (request, reply) => {
        reply.type('text/html');
        return `
            <html>
                <head></head>
                <body>
                    <div id="container"></div>
                    <div id="success"></div>
                    <script defer src="${js}"></script>
                </body>
            </html>
        `;
    });

    const address = await server.listen();
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(new URL(`/`, address).href);
    const button = await page.$('button');
    await button.click();

    const html = await page.$eval('#success', (el) => el.innerHTML);

    t.equal(html, 'true');

    await browser.close();

    await server.close();
});
