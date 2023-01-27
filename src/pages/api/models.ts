import { unlink, writeFile } from 'fs/promises';
import { UpdateRequest, groupUpdatesByType, post, synchronizeDB } from 'src/lib/api';
import { fileExists } from 'src/lib/fs-util';
import { Model, ModelId } from 'src/lib/schema';
import { getModelDataPath } from 'src/lib/static-data';

export type ModelsRequestBody = UpdateRequest<ModelId, Model>[];

export default post<ModelsRequestBody>(
    synchronizeDB(async (updates) => {
        const groups = groupUpdatesByType(updates);

        await Promise.all(
            [...groups.change].map(async ([id, value]) => {
                const file = getModelDataPath(id);
                await writeFile(file, JSON.stringify(value, undefined, 4), 'utf-8');
                console.warn('Updated model data of ' + id);
            })
        );

        await Promise.all(
            [...groups.delete].map(async (id) => {
                const file = getModelDataPath(id);
                if (await fileExists(file)) {
                    await unlink(file);
                    console.warn('Delete model data of ' + id);
                } else {
                    console.warn('Model data of ' + id + " cannot be deleted because it doesn't exist");
                }
            })
        );
    })
);
