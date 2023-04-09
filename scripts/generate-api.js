// Generates a fake JSON api

const fs = require('fs');
const path = require('path');

const API_DIR = 'out/api/v1';
fs.mkdirSync(API_DIR, { recursive: true });

const models = fs.readdirSync('data/models');

const data = {};

models.forEach((model) => {
    const name = model.replace('.json', '');
    const dataPath = `data/models/${model}`;
    const modelData = fs.readFileSync(dataPath, 'utf8');
    data[name] = JSON.parse(modelData);
});

fs.writeFileSync(path.join(API_DIR, 'models.json'), JSON.stringify(data, null, 2));
