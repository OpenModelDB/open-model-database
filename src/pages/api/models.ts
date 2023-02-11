import { unlink } from 'fs/promises';
import { UpdateRequest } from '../../lib/api-types';
import { Model, ModelId } from '../../lib/schema';
import { groupUpdatesByType, post, synchronizeDB } from '../../lib/server/api-impl';
import { getModelDataPath, writeModelData } from '../../lib/server/data';
import { fileExists } from '../../lib/server/fs-util';

export type ModelsRequestBody = UpdateRequest<ModelId, Model>[];

export default post<ModelsRequestBody>(
    synchronizeDB(async (updates) => {
        const groups = groupUpdatesByType(updates);

        await Promise.all(
            [...groups.change].map(async ([id, value]) => {
                await writeModelData(id, value);
                console.warn(`Updated model data of ${id}`);
            })
        );

        await Promise.all(
            [...groups.delete].map(async (id) => {
                const file = getModelDataPath(id);
                if (await fileExists(file)) {
                    await unlink(file);
                    console.warn(`Delete model data of ${id}`);
                } else {
                    console.warn(`Model data of ${id} cannot be deleted because it doesn't exist`);
                }
            })
        );
    })
);
