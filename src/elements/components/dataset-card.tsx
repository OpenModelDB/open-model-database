/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/display-name */
import React, { memo, useRef, useState } from 'react';
import { LazyLoadComponent } from 'react-lazy-load-image-component';
import { useDevicePixelRatio } from '../../lib/hooks/use-device-pixel-ratio';
import { useUpdateDataset } from '../../lib/hooks/use-update-dataset';
import { useUsers } from '../../lib/hooks/use-users';
import { useWebApi } from '../../lib/hooks/use-web-api';
import { joinList } from '../../lib/react-util';
import { Dataset, DatasetId, ImageSize, PairedImage } from '../../lib/schema';
import { asArray, assertNever, joinClasses } from '../../lib/util';
import { EditableTags } from './editable-tags';
import { Link } from './link';
import style from './model-card.module.scss';

export interface DatasetCardProps {
    id: DatasetId;
    dataset: Dataset;
    lazy?: boolean;
}

const EMPTY_SIZE: ImageSize = {
    height: 0,
    width: 0,
};

function getNaturalSize(image: HTMLImageElement): ImageSize {
    return {
        height: image.naturalHeight,
        width: image.naturalWidth,
    };
}

const SideBySideImage = ({ datasetName, image }: { datasetName: string; image: PairedImage }) => {
    const [lrDimensions, setLrDimensions] = useState(EMPTY_SIZE);
    const [srDimensions, setSrDimensions] = useState(EMPTY_SIZE);

    const maxHeight = Math.max(lrDimensions.height, srDimensions.height);
    const maxWidth = Math.max(lrDimensions.width, srDimensions.width);

    const lrRef = useRef<HTMLImageElement>(null);
    const srRef = useRef<HTMLImageElement>(null);

    const dpr = useDevicePixelRatio();
    const scale = (1 / dpr) * Math.max(1, Math.round(dpr + 0.16));

    return (
        <div className="flex h-full w-full">
            <div className="relative flex h-full w-1/2 content-center overflow-hidden align-middle">
                <img
                    alt={datasetName}
                    className="rendering-pixelated absolute top-1/3 left-1/2 z-0 m-auto object-cover object-center"
                    loading="lazy"
                    ref={lrRef}
                    src={image.LR}
                    style={{
                        height: `${maxHeight}px`,
                        width: `${maxWidth}px`,
                        transform: `translate(-50%, -50%) scale(${scale})`,
                    }}
                    onLoad={(e) => {
                        setLrDimensions(getNaturalSize(e.target as HTMLImageElement));
                    }}
                />
            </div>
            <div className="relative flex h-full w-1/2 content-center overflow-hidden align-middle">
                <img
                    alt={datasetName}
                    className="rendering-pixelated absolute top-1/3 left-1/2 z-0 m-auto object-cover object-center"
                    loading="lazy"
                    ref={srRef}
                    src={image.SR}
                    style={{
                        height: `${maxHeight}px`,
                        width: `${maxWidth}px`,
                        transform: `translate(-50%, -50%) scale(${scale})`,
                    }}
                    onLoad={(e) => {
                        setSrDimensions(getNaturalSize(e.target as HTMLImageElement));
                    }}
                />
            </div>
        </div>
    );
};

const getDatasetCardImageComponent = (dataset: Dataset | undefined) => {
    const image = dataset?.images?.[0];
    if (!dataset || !image) {
        return <div className="margin-auto z-0 w-full py-20 text-center text-gray-500">No Image</div>;
    }
    switch (image.type) {
        case 'paired': {
            return (
                <SideBySideImage
                    datasetName={dataset.name}
                    image={image}
                />
            );
        }
        case 'standalone': {
            const imageSrc = image.url;
            return (
                <img
                    alt={dataset.name}
                    className="margin-auto z-0 h-full w-full object-cover"
                    loading="lazy"
                    src={imageSrc}
                />
            );
        }
        default:
            return assertNever(image);
    }
};

const DatasetCardContent = memo(({ id, dataset }: DatasetCardProps) => {
    const { userData } = useUsers();
    const { webApi, editMode } = useWebApi();
    const { updateDatasetProperty } = useUpdateDataset(webApi, id);

    const isPaired = dataset.images?.[0]?.type === 'paired' && !editMode;

    return (
        <div className={style.inner}>
            <Link
                className={joinClasses(style.thumbnail, isPaired && style.paired, 'bg-fade-300 dark:bg-fade-700 ')}
                href={`/datasets/${id}`}
                tabIndex={-1}
            >
                {getDatasetCardImageComponent(dataset)}
            </Link>

            <div className={joinClasses(style.details, isPaired && style.paired)}>
                <Link
                    className={`${style.name} block text-xl font-bold text-gray-800 dark:text-gray-100`}
                    href={`/datasets/${id}`}
                >
                    {dataset.name}
                </Link>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {'by '}
                    {joinList(
                        asArray(dataset.author).map((userId) => (
                            <Link
                                className="font-bold text-accent-600 dark:text-accent-400"
                                href={`/users/${userId}`}
                                key={userId}
                            >
                                {userData.get(userId)?.name ?? `unknown user:${userId}`}
                            </Link>
                        ))
                    )}
                </div>

                {/* Description */}
                <div className="mb-2 mt-1 text-sm text-gray-600 line-clamp-3 dark:text-gray-400">
                    {dataset.description}
                </div>

                {/* Tags */}
                <div className="flex flex-row flex-wrap gap-1 text-xs">
                    <EditableTags
                        readonly={!editMode}
                        tags={dataset.tags}
                        onChange={(tags) => updateDatasetProperty('tags', tags)}
                    />
                </div>
            </div>
        </div>
    );
});

export const DatasetCard = memo(({ id, dataset, lazy = false }: DatasetCardProps) => {
    const { editMode } = useWebApi();

    const inner = (
        <div
            className={joinClasses(
                style.modelCard,
                !editMode && style.overflowHidden,
                'border-gray-300 bg-white shadow-lg hover:shadow-2xl dark:border-gray-700 dark:bg-fade-900'
            )}
        >
            <DatasetCardContent
                dataset={dataset}
                id={id}
            />
        </div>
    );

    if (!lazy) return inner;

    return (
        <LazyLoadComponent
            placeholder={
                <div
                    className={`${style.modelCard} border-gray-300 bg-white shadow-lg hover:shadow-2xl dark:border-gray-700 dark:bg-fade-900`}
                />
            }
        >
            {inner}
        </LazyLoadComponent>
    );
});
