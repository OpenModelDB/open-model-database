// Generates a fake JSON api

import fs from 'fs';
import path from 'path';
import { fileApi } from '../src/lib/server/file-data';

const generateAPI = async () => {
    const API_DIR = 'out/api/v1';
    fs.mkdirSync(API_DIR, { recursive: true });

    const modelData = await fileApi.models.getAll();
    const models = Object.fromEntries(modelData.entries());

    const architectureData = await fileApi.architectures.getAll();
    const architectures = Object.fromEntries(architectureData.entries());

    const tagData = await fileApi.tags.getAll();
    const tags = Object.fromEntries(tagData.entries());

    const userData = await fileApi.users.getAll();
    const users = Object.fromEntries(userData.entries());

    fs.writeFileSync(path.join(API_DIR, 'models.json'), JSON.stringify(models, null, 2));
    fs.writeFileSync(path.join(API_DIR, 'architectures.json'), JSON.stringify(architectures, null, 2));
    fs.writeFileSync(path.join(API_DIR, 'tags.json'), JSON.stringify(tags, null, 2));
    fs.writeFileSync(path.join(API_DIR, 'users.json'), JSON.stringify(users, null, 2));
};

generateAPI().catch((err) => {
    console.error(err);
    process.exit(1);
});
