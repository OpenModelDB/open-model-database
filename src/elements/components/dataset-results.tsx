import React, { memo, useMemo } from 'react';
import { Dataset, DatasetId } from '../../lib/schema';
import { DatasetCardGrid } from './dataset-card-grid';
import style from './model-results.module.scss';

interface DatasetResultsProps {
    datasetData: ReadonlyMap<DatasetId, Dataset>;
    datasets: readonly DatasetId[];
}

// eslint-disable-next-line react/display-name
export const DatasetResults = memo(({ datasets, datasetData }: DatasetResultsProps) => {
    const dataPairs = useMemo(() => {
        const pairs: (readonly [DatasetId, Dataset])[] = [];
        for (const id of datasets) {
            const data = datasetData.get(id);
            if (data) {
                pairs.push([id, data]);
            }
        }
        return pairs;
    }, [datasets, datasetData]);

    return (
        <>
            <div className={`${style.controls} mb-3`}>
                <span className="mx-3">
                    Found <span className="font-medium">{datasets.length}</span> dataset
                    {datasets.length === 1 ? '' : 's'}
                </span>
            </div>
            <DatasetCardGrid datasets={dataPairs} />
        </>
    );
});
