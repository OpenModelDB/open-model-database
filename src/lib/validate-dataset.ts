import { DBApi } from './data-api';
import { Dataset, DatasetId } from './schema';
import { canonicalizeDatasetId } from './schema-util';
import { Report } from './validate-model';

export const validateDataset = (dataset: Dataset, datasetId: DatasetId, api: DBApi): Report[] => {
    const errors: Report[] = [];
    const report = (message: string, fix?: () => Promise<void>) =>
        errors.push({ message: `Dataset ${datasetId}: ${message}`, fix });

    const expected = canonicalizeDatasetId(datasetId);
    if (expected !== datasetId) {
        report(`Dataset ID should be ${expected}`, () => api.datasets.changeId(datasetId, expected));
    }

    if (dataset.images?.some((image) => image.thumbnail)) {
        report(`Thumbnails are automatically generated and should not appear in the database`, async () => {
            const dataset = await api.datasets.get(datasetId);
            for (const image of dataset.images || []) {
                delete image.thumbnail;
            }
            await api.datasets.update([[datasetId, dataset]]);
        });
    }

    return errors;
};
