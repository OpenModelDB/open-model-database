import { MODEL_PROPS, validateType } from '../src/lib/model-props';
import { ArchId, ModelId, TagId, UserId } from '../src/lib/schema';
import { fileApi } from '../src/lib/server/file-data';
import { typedEntries } from '../src/lib/util';

const generateAPI = async () => {
    const modelData = await fileApi.models.getAll();
    const architectureData = await fileApi.architectures.getAll();
    const tagData = await fileApi.tags.getAll();
    const userData = await fileApi.users.getAll();

    const errors: string[] = [];
    for (const [modelId, model] of modelData) {
        const report = (message: string) => errors.push(`Model ${modelId}: ${message}`);

        if (!modelId.startsWith(`${model.scale}x`)) report(`Model ID must start with scale`);

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
                report(error);
            }
        }
    }

    errors.forEach((error) => console.error(error));
    process.exit(errors.length);
};

generateAPI().catch((err) => {
    console.error(err);
    process.exit(1);
});
