// Generates a fake JSON api

import fs from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';
import { fileApi } from '../src/lib/server/file-data';

const generateAPI = async () => {
    const API_DIR = 'out/api/v1';
    fs.mkdirSync(API_DIR, { recursive: true });

    const promises = Object.keys(fileApi).map(async (dataName) => {
        const data = await fileApi[dataName as keyof typeof fileApi].getAll();
        const json = Object.fromEntries(data.entries());
        await writeFile(path.join(API_DIR, `${dataName}.json`), JSON.stringify(json, null, 2));
    });
    await Promise.all(promises);
};

generateAPI().catch((err) => {
    console.error(err);
    process.exit(1);
});
