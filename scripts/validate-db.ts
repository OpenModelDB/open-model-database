import fs from 'fs/promises';
import path from 'path';
import { fileApi } from '../src/lib/server/file-data';
import { Report, validateModel } from '../src/lib/validate-model';

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

const getReports = async (): Promise<Report[]> => {
    const modelData = await fileApi.models.getAll();
    const architectureData = await fileApi.architectures.getAll();
    const tagData = await fileApi.tags.getAll();
    const userData = await fileApi.users.getAll();

    const errors: Report[] = [];
    for (const [modelId, model] of modelData) {
        errors.push(...validateModel(model, modelId, modelData, architectureData, tagData, userData, fileApi));
    }

    const jsonFiles = (await getAllFiles('data/')).filter((file) => file.endsWith('.json'));
    await Promise.all(
        jsonFiles.map(async (file) => {
            const content = await fs.readFile(file, 'utf-8');
            const formatted = JSON.stringify(JSON.parse(content), null, 4);

            if (content !== formatted) {
                errors.push({
                    message: `File ${file} is not formatted correctly`,
                    fix: async () => {
                        // we have to read the file again, because another fix might have changed it
                        const content = await fs.readFile(file, 'utf-8');
                        const formatted = JSON.stringify(JSON.parse(content), null, 4);
                        await fs.writeFile(file, formatted, 'utf-8');
                    },
                });
            }
        })
    );

    return errors;
};

const run = async () => {
    const performFix = process.argv.includes('--fix');
    const maxPasses = 10;
    for (let i = 0; i <= maxPasses; i++) {
        const reports = await getReports();

        const fixes = reports.flatMap(({ fix }) => (fix ? [fix] : []));
        if (i !== maxPasses && performFix && fixes.length > 0) {
            // fixes must be applied sequentially
            for (const fix of fixes) {
                await fix();
            }
            continue;
        }

        reports.forEach(({ message }) => console.error(message));
        if (fixes.length > 0) {
            console.log('');
            console.log(`${fixes.length}/${reports.length} error(s) can be auto-fixed by running 'npm run fix-db'`);
        }
        process.exit(reports.length);
    }
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
