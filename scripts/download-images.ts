import fetch from 'cross-fetch';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import { Model, ModelId } from '../src/lib/schema';
import { fileApi } from '../src/lib/server/file-data';

// configuration

const outputDir = './data/images';
const maxParallelDownloads = 3;

function filter(image: ImagePath): boolean {
    return image.url.includes('discord');
}

// application code

interface ImagePath {
    modelId: ModelId;
    url: string;
    name: string;
}
function getImages(modelId: ModelId, model: Model) {
    return model.images.flatMap((image, i): ImagePath[] => {
        if (image.type === 'standalone') {
            return [{ modelId, url: image.url, name: `${i}-standalone-main` }];
        }
        return [
            { modelId, url: image.LR, name: `${i}-paired-lr` },
            { modelId, url: image.SR, name: `${i}-paired-sr` },
        ];
    });
}
function hashImage(image: ImagePath): ImagePath {
    const hash = createHash('sha256').update(image.url).digest('hex').slice(0, 8);
    return { ...image, name: `${image.name}-${hash}` };
}
function addExtension(image: ImagePath): ImagePath {
    if (/\.(png|jpeg|jpg|webp|mp4)$/.test(image.url)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const ext = image.url.split('.').pop()!;
        return { ...image, name: `${image.name}.${ext}` };
    }
    throw new Error(`Cannot get extension from URL: ${image.url}`);
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

async function run() {
    console.log('Fetching model data...');
    const models = await fileApi.models.getAll();

    const images = [...models]
        .flatMap(([modelId, model]) => getImages(modelId, model))
        .filter(filter)
        .map(hashImage)
        .map(addExtension);

    console.log(`Downloading ${images.length} images...`);
    let index = 0;
    let skipped = 0;
    await parallel(maxParallelDownloads, images, async (image) => {
        process.stdout.write(`\r${++index}/${images.length} (${skipped} skipped)`);

        try {
            const dir = `${outputDir}/${image.modelId}`;
            const file = `${dir}/${image.name}`;

            if (await fileExists(file)) {
                skipped++;
                return;
            }

            const resp = await fetch(image.url);
            const contentType = resp.headers.get('content-type');
            if (!contentType || !/^(?:image|video)\/\w+$/.test(contentType)) {
                throw new Error(`Invalid content type: ${String(contentType)}`);
            }

            const data = new Uint8Array(await resp.arrayBuffer());

            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(file, data);
        } catch (error) {
            skipped++;
            console.error(`Failed to download image for ${image.modelId}: ${image.url}`);
            console.error(error);
        }
    });

    console.log('\nDone.');
}

run().catch((e) => console.error(e));
