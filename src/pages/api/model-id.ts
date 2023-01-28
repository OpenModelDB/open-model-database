import { rename } from 'fs/promises';
import { ChangeIdRequest } from 'src/lib/api-types';
import { ModelId } from 'src/lib/schema';
import { post, synchronizeDB } from 'src/lib/server/api-impl';
import { getAllModelIds, getModelDataPath, mutateModels } from 'src/lib/server/data';

export type ModelsRequestBody = ChangeIdRequest<ModelId>;

export default post<ModelsRequestBody>(
    synchronizeDB(async ({ id, newId }) => {
        if (id === newId) return;

        const modelIds = await getAllModelIds();
        if (!modelIds.includes(id)) {
            throw new Error('Cannot change model id ' + id + ' because it does not exist');
        }
        if (modelIds.includes(newId)) {
            throw new Error(`Cannot change model id ${id} to ${newId} because ${newId} already exists`);
        }

        // We do the renaming with a temp file in between because of Windows.
        // Windows FS ignore case, so if the path you rename a file only changes the case of some letters,
        // then Windows won't actually rename the file.
        const from = getModelDataPath(id);
        const to = getModelDataPath(newId);
        const temp = to + '.tmp';
        await rename(from, temp);
        await rename(temp, to);

        await mutateModels((model) => {
            let changed = false;
            if (model.pretrainedModelG === id) {
                model.pretrainedModelG = newId;
                changed = true;
            }
            if (model.pretrainedModelD === id) {
                model.pretrainedModelD = newId;
                changed = true;
            }
            return changed;
        });
    })
);
