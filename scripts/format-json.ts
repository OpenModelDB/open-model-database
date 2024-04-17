import fs from 'fs/promises';
import path from 'path';

const check = process.argv.includes('--check');

const getAllFiles = async (dir: string): Promise<string[]> => {
    const names = await fs.readdir(dir);

    return (
        await Promise.all(
            names.map(async (name) => {
                const filePath = path.join(dir, name);
                const stat = await fs.stat(filePath);
                if (stat.isDirectory()) {
                    return getAllFiles(filePath);
                } else {
                    return filePath;
                }
            })
        )
    ).flat();
};

let errors = 0;

const formatJSONFile = async (file: string) => {
    const oldText = await fs.readFile(file, 'utf-8');
    const data = JSON.parse(oldText) as unknown as Record<string, unknown>;

    const isModelFile = path.basename(path.dirname(file)) === 'models';
    if (isModelFile) {
        delete data['thumbnail'];
    }

    const newText = JSON.stringify(data, null, 4);
    if (newText !== oldText) {
        if (check) {
            errors++;
            console.error(`Would format file: ${path.basename(file)}`);
        } else {
            await fs.writeFile(file, newText, 'utf-8');
        }
    }
};

const formatJSON = async () => {
    const dataDir = 'data/';
    const jsonFiles = (await getAllFiles(dataDir)).filter((file) => file.endsWith('.json'));

    await Promise.all(jsonFiles.map(formatJSONFile));

    if (errors > 0) {
        console.error(`Found ${errors} files that need formatting`);
        console.log("Run 'run run fix-db' to format these files.");
        process.exit(errors);
    }
};

formatJSON().catch((err) => {
    console.error(err);
    process.exit(1);
});
