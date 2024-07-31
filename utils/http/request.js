import { readFile } from 'node:fs/promises';

/**
 * HTTP Utility for making requests against an Eik server
 *
 * @param {{method:string,host:string,pathname:string,data:object,file:string,map:string,token:string}} options
 *
 * @returns {Promise<{status:number,message:object|string}>} - Promise that resolves to an object with properties status and message
 *
 * @throws Error
 */
async function request(options) {
    const { method = 'POST', host, pathname, data, file, map, token } = options;
    const body = new FormData();
    const headers = new Headers();

    if (data) {
        for (const [key, value] of Object.entries(data)) {
            body.set(key, value);
        }
    }

    if (file) {
        const fileData = await readFile(file);
        body.set('package', new Blob([fileData]));
    }

    if (map) {
        const mapData = await readFile(map);
        body.set('map', new Blob([mapData]));
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    try {
        const url = new URL(pathname, host);
        url.search = `?t=${Date.now()}`;

        const res = await fetch(url, { method, body, headers });

        if (!res.ok) {
            const err = new Error(
                `Server responded with a non 200 ok status code. Response: ${res.status}`,
            );
            // @ts-ignore
            err.statusCode = res.status;
            throw err;
        }
        if (res?.headers?.get('content-type')?.includes('application/json')) {
            return { message: await res.json(), status: res.status };
        }
        return { message: await res.text(), status: res.status };
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        throw err;
    }
}

export default request;
