import fs from 'fs/promises';
import path from 'path';
import { MODEL_PROPS, validateType } from '../src/lib/model-props';
import { ArchId, ModelId, TagId, UserId } from '../src/lib/schema';
import { canonicalizeModelId } from '../src/lib/schema-util';
import { fileApi } from '../src/lib/server/file-data';
import { typedEntries } from '../src/lib/util';

interface Report {
    message: string;
    fix?: () => Promise<void>;
}

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
        const report = (message: string, fix?: () => Promise<void>) =>
            errors.push({ message: `Model ${modelId}: ${message}`, fix });

        if (modelId.startsWith(`${model.scale}x`)) {
            const expected = canonicalizeModelId(modelId);
            if (expected !== modelId) {
                report(`Model ID should be ${expected}`, () => fileApi.models.changeId(modelId, expected));
            }
        } else {
            report(`Model ID must start with scale`, () =>
                fileApi.models.changeId(modelId, `${model.scale}x-${modelId.replace(/^\d+x-?/, '')}` as ModelId)
            );
        }

        if (model.thumbnail || model.images.some((image) => image.thumbnail)) {
            report(`Thumbnails are automatically generated and should not appear in the database`, async () => {
                const model = await fileApi.models.get(modelId);
                delete model.thumbnail;
                for (const image of model.images) {
                    delete image.thumbnail;
                }
                await fileApi.models.update([[modelId, model]]);
            });
        }

        for (const [key, prop] of typedEntries(MODEL_PROPS)) {
            const value = model[key];

            if (value === null || value === undefined) {
                if (!prop.optional) report(`Missing required property '${key}'`);
                continue;
            }

            const error = validateType(value, prop, `'${key}'`, {
                isValidModelId: (id) => modelData.has(id as ModelId),
                isValidUserId: (id) => userData.has(id as UserId),
                isValidTagId: (id) => tagData.has(id as TagId),
                isValidArchitectureId: (id) => architectureData.has(id as ArchId),
            });
            if (error) {
                const { message, fix } = error;
                report(
                    message,
                    fix &&
                        (async () => {
                            const model = await fileApi.models.get(modelId);
                            const newValue = fix();
                            if (newValue === undefined) {
                                delete model[key];
                            } else {
                                model[key] = newValue as never;
                            }
                            await fileApi.models.update([[modelId, model]]);
                        })
                );
            }
        }
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
