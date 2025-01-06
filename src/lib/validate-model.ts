import { DBApi } from './data-api';
import { MODEL_PROPS, validateType } from './model-props';
import { Arch, ArchId, Model, ModelId, Tag, TagId, User, UserId } from './schema';
import { canonicalizeModelId } from './schema-util';
import { typedEntries } from './util';

export interface Report {
    message: string;
    fix?: () => Promise<void>;
}

export const validateModel = (
    model: Model,
    modelId: ModelId,
    modelData: ReadonlyMap<ModelId, Model>,
    architectureData: ReadonlyMap<ArchId, Arch>,
    tagData: ReadonlyMap<TagId, Tag>,
    userData: ReadonlyMap<UserId, User>,
    api: DBApi
): Report[] => {
    const errors: Report[] = [];
    const report = (message: string, fix?: () => Promise<void>) =>
        errors.push({ message: `Model ${modelId}: ${message}`, fix });

    if (modelId.startsWith(`${model.scale}x-`)) {
        const expected = canonicalizeModelId(modelId);
        if (expected !== modelId) {
            report(`Model ID should be ${expected}`, () => api.models.changeId(modelId, expected));
        }
    } else {
        report(`Model ID must start with scale`, () =>
            api.models.changeId(modelId, `${model.scale}x-${modelId.replace(/^\d+x-?/, '')}` as ModelId)
        );
    }

    if (model.thumbnail || model.images.some((image) => image.thumbnail)) {
        report(`Thumbnails are automatically generated and should not appear in the database`, async () => {
            const model = await api.models.get(modelId);
            delete model.thumbnail;
            for (const image of model.images) {
                delete image.thumbnail;
            }
            await api.models.update([[modelId, model]]);
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
                        const model = await api.models.get(modelId);
                        const newValue = fix();
                        if (newValue === undefined) {
                            delete model[key];
                        } else {
                            model[key] = newValue as never;
                        }
                        await api.models.update([[modelId, model]]);
                    })
            );
        }
    }
    return errors;
};
