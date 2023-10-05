import fetch from 'cross-fetch';
import { fileApi } from '../src/lib/server/file-data';

const isLinkBrokenMega = async (url: string): Promise<string | undefined> => {
    try {
        const response = await fetch(url, { method: 'GET' });

        if (response.status >= 400) {
            return `${response.status}: ${response.statusText}`;
        }
        const html = await response.text();
        const title = html.match(/<meta property="og:title" content="([^"]*)" \/>/)?.[1];
        if (!title) {
            return `Unable to parse page`;
        }
        if (title === 'File on MEGA') {
            // this is the title for the page when the file doesn't exist
            return `File not found`;
        }
        return undefined;
    } catch (error) {
        return String(error);
    }
};
const isLinkBroken = async (url: string): Promise<string | undefined> => {
    if (url.startsWith('https://mega.nz/')) {
        return isLinkBrokenMega(url);
    }
    if (url.startsWith('https://1drv.ms/')) {
        // requires login, so we'll always get a 403
        return undefined;
    }

    try {
        const response = await fetch(url, { method: 'HEAD' });

        if (response.status >= 400) {
            return `${response.status}: ${response.statusText}`;
        }
        return undefined;
    } catch (error) {
        return String(error);
    }
};

const run = async () => {
    const modelData = [...(await fileApi.models.getAll())];

    const modelFiles = modelData.flatMap(([modelId, model]) => {
        return model.resources.flatMap((r) => r.urls).map((url) => ({ modelId, model, url }));
    });

    console.log(`Checking ${modelFiles.length} URLs...`);

    // we have check everything sequentially to avoid getting rate limited
    let brokenCount = 0;
    for (const [{ modelId, url }, i] of modelFiles.map((x, i) => [x, i] as const)) {
        process.stdout.write(`${i + 1}/${modelFiles.length} ${url.slice(0, 40)}\r`);
        const reason = await isLinkBroken(url);
        if (reason) {
            console.log(`${reason} for model ${modelId}: ${url}`);
            brokenCount++;
        }
    }

    console.log(`Done checking ${brokenCount} URL(s)${' '.repeat(40)}`);
    process.exit(brokenCount);
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
