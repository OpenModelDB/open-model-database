import fetch from 'cross-fetch';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';
import { isSelfHosted, toDirectDownloadLink } from '../src/lib/download-util';
import { hashSha256 } from '../src/lib/model-files';
import { Model, ModelId, PthFile } from '../src/lib/schema';
import { fileApi } from '../src/lib/server/file-data';

// configuration

const outputDir = './data/model-files';
const maxParallelDownloads = 1;

// application code

interface ModelDownload {
    modelId: ModelId;
    url: string;
    internal: boolean;
    size: number;
    sha256: string;
}
function getModelPth(model: Model): PthFile | undefined {
    for (const r of model.resources) {
        if (r.type === 'pth') {
            return r;
        }
    }
}
function getModelDownload(modelId: ModelId, model: Model): ModelDownload | undefined {
    const pth = getModelPth(model);
    if (!pth) {
        return;
    }

    const { urls, size, sha256 } = pth;
    for (const url of urls) {
        if (url.endsWith('.pth')) {
            return { modelId, size, sha256, url, internal: isSelfHosted(url) };
        }
        const direct = toDirectDownloadLink(url);
        if (direct !== url) {
            return { modelId, size, sha256, url: direct, internal: false };
        }
    }
}

const progressLength = 100;
let lastProgressMessage = '';
function printProgress(message: string) {
    lastProgressMessage = message;
    process.stdout.write(`\r${message.slice(0, progressLength).padEnd(progressLength)}`);
}
function disableProgress() {
    process.stdout.write(`\r${' '.repeat(progressLength)}\r`);
}
function enableProgress() {
    printProgress(lastProgressMessage);
}

function parallel<T>(limit: number, array: T[], fn: (item: T) => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
        let index = 0;
        let running = 0;
        function next() {
            if (index >= array.length) {
                if (running === 0) {
                    resolve();
                }
                return;
            }
            running++;
            fn(array[index++])
                .then(() => {
                    running--;
                    next();
                })
                .catch(reject);
        }
        for (let i = 0; i < limit; i++) {
            next();
        }
    });
}

function fileExists(path: string): Promise<boolean> {
    return fs
        .access(path)
        .then(() => true)
        .catch(() => false);
}

async function fetchDirectDownload(url: string): Promise<Response> {
    const resp = await fetch(url);
    const contentType = resp.headers.get('content-type');

    // Google Drives me insane
    // The direct download link is a redirect to "can't scan for viruses" page,
    // when the user is expected to press a button. So I download the page, and
    // submit the form to get the actual download link.
    if (url.startsWith('https://drive.google.com/uc?') && contentType === 'text/html; charset=utf-8') {
        const html = await resp.text();
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        const form = doc.querySelector<HTMLFormElement>('form#download-form');
        if (!form) {
            throw new Error(`Couldn't find download form on Google Drive page`);
        }

        const newUrl = new URL(form.action);
        form.querySelectorAll<HTMLInputElement>('input[name][value]').forEach((i) => {
            newUrl.searchParams.set(i.name, i.value);
        });
        // e.g. https://drive.usercontent.google.com/download?id=1iYUA2TzKuxI0vzmA-UXr_nB43XgPOXUg&export=download&authuser=0&confirm=t&uuid=4c53d534-3c81-4cbd-b540-730c31674aba&at=APZUnTVMRdAMoCmPuS8VkjlkwVwF%3A1705498458650

        return await fetch(newUrl);
    }

    return resp;
}

async function run() {
    console.log('Fetching model data...');
    const models = [...(await fileApi.models.getAll())];

    console.log(`Downloading ${models.length} models...`);
    let index = 0;
    let skipped = 0;
    let failed = 0;
    await fs.mkdir(outputDir, { recursive: true });
    await parallel(maxParallelDownloads, models, async ([modelId, model]) => {
        printProgress(`\r${++index}/${models.length} (${skipped} skipped, ${failed} failed) ${modelId}`);

        let url = '';
        try {
            const file = `${outputDir}/${modelId}.pth`;

            const modelPth = getModelPth(model);
            if (!modelPth) {
                disableProgress();
                console.log(`Couldn't find .pth for ${modelId}`);
                enableProgress();
                skipped++;
                return;
            }
            const { size, sha256 } = modelPth;

            const modelFile = getModelDownload(modelId, model);
            if (!modelFile) {
                disableProgress();
                console.log(`Couldn't find model file for ${modelId}`);
                enableProgress();
                skipped++;
                return;
            }
            url = modelFile.url;

            if (await fileExists(file)) {
                const checkFileContent = async () => {
                    const fileBytes = await fs.readFile(file);
                    const dataSha256 = await hashSha256(fileBytes);

                    if (size !== fileBytes.length) {
                        throw new Error(`Invalid data: Expected size ${size}, got ${fileBytes.length}`);
                    }
                    if (sha256 !== dataSha256) {
                        throw new Error(`Invalid data: Expected SHA256 ${sha256}, got ${dataSha256}`);
                    }
                };

                await Promise.all([checkFileContent()]);
                return;
            }

            const resp = await fetchDirectDownload(url);
            const contentType = resp.headers.get('content-type');
            if (!contentType || contentType !== 'application/octet-stream') {
                throw new Error(`Invalid content type: ${String(contentType)}`);
            }
            const contentLength = resp.headers.get('content-length');
            if (contentLength && contentLength !== String(size)) {
                throw new Error(`Invalid content length: Expected size ${size}, got ${contentLength}`);
            }

            const data = new Uint8Array(await resp.arrayBuffer());
            const dataSha256 = await hashSha256(data);

            if (size !== data.length) {
                throw new Error(`Invalid data: Expected size ${size}, got ${data.length}`);
            }
            if (sha256 !== dataSha256) {
                throw new Error(`Invalid data: Expected SHA256 ${sha256}, got ${dataSha256}`);
            }

            await fs.writeFile(file, data);
        } catch (error) {
            failed++;
            disableProgress();
            console.error(`Failed to download model for ${modelId}: ${url}`);
            console.error(error);
            enableProgress();
        }
    });
    disableProgress();

    const percent = (n: number) => `${Math.round((n / models.length) * 100)}%`;
    console.log('Done.');
    console.log(`Downloaded models: ${index - skipped - failed}/${models.length}`);
    console.log(`Skipped models: ${skipped} (${percent(skipped)}) (unable to get direct download link)`);
    console.log(`Failed models: ${failed} (${percent(failed)})`);
}

run().catch((e) => console.error(e));
