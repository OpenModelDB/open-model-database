// Generates a fake JSON api

const fs = require('fs');

const models = fs.readdirSync('data/models');

const data = {};

models.forEach((model) => {
    const name = model.replace('.json', '');
    const dataPath = `data/models/${model}`;
    const modelData = fs.readFileSync(dataPath, 'utf8');
    data[name] = JSON.parse(modelData);
});

fs.mkdirSync('out/api', { recursive: true });

fs.writeFileSync('out/api/models', JSON.stringify(data, null, 2));
