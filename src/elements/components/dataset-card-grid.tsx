import React from 'react';
import { Dataset, DatasetId } from '../../lib/schema';
import { DatasetCard } from './dataset-card';
import style from './model-card-grid.module.scss';

export interface DatasetCardGridProps {
    datasets: readonly (readonly [DatasetId, Dataset])[];
}

export function DatasetCardGrid({ datasets }: DatasetCardGridProps) {
    return (
        <div className={style.grid}>
            {datasets.map(([id, dataset], i) => (
                <DatasetCard
                    dataset={dataset}
                    id={id}
                    key={id}
                    lazy={i >= 12}
                />
            ))}
        </div>
    );
}
