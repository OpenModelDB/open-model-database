/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/display-name */
import React, { memo, useState } from 'react';
import { LazyLoadComponent } from 'react-lazy-load-image-component';
import { useArchitectures } from '../../lib/hooks/use-architectures';
import { useUpdateModel } from '../../lib/hooks/use-update-model';
import { useUsers } from '../../lib/hooks/use-users';
import { useWebApi } from '../../lib/hooks/use-web-api';
import { joinList } from '../../lib/react-util';
import { Image, Model, ModelId } from '../../lib/schema';
import { asArray, joinClasses } from '../../lib/util';
import { EditableTags } from './editable-tags';
import { Link } from './link';
import style from './model-card.module.scss';

interface BaseModelCardProps {
    id: ModelId;
    model: Model;
}
interface ModelCardProps extends BaseModelCardProps {
    lazy?: boolean;
}

const SideBySideImage = ({ model, image }: { model: Model; image: Image }) => {
    const [lrDimensions, setLrDimensions] = useState({
        height: 0,
        width: 0,
    });
    const [srDimensions, setSrDimensions] = useState({
        height: 0,
        width: 0,
    });

    const maxHeight = Math.max(lrDimensions.height, srDimensions.height);
    const maxWidth = Math.max(lrDimensions.width, srDimensions.width);

    if (image.type !== 'paired') {
        return null;
    }

    return (
        <div className="flex h-full w-full">
            <div className="relative flex h-full w-1/2 content-center overflow-hidden align-middle">
                <img
                    alt={model.name}
                    className="rendering-pixelated absolute top-1/2 left-1/2 z-0 m-auto object-cover object-center"
                    loading="lazy"
                    src={image.LR}
                    style={{
                        height: `${maxHeight}px`,
                        width: `${maxWidth}px`,
                        transform: 'translate(-50%, -50%)',
                    }}
                    onLoad={(e) => {
                        const target = e.target as HTMLImageElement;
                        setLrDimensions({
                            height: target.naturalHeight,
                            width: target.naturalWidth,
                        });
                    }}
                />
            </div>
            <div className="relative flex h-full w-1/2 content-center overflow-hidden align-middle">
                <img
                    alt={model.name}
                    className="rendering-pixelated absolute top-1/2 left-1/2 z-0 m-auto object-cover object-center"
                    loading="lazy"
                    src={image.SR}
                    style={{
                        height: `${maxHeight}px`,
                        width: `${maxWidth}px`,
                        transform: 'translate(-50%, -50%)',
                    }}
                    onLoad={(e) => {
                        const target = e.target as HTMLImageElement;
                        setSrDimensions({
                            height: target.naturalHeight,
                            width: target.naturalWidth,
                        });
                    }}
                />
            </div>
        </div>
    );
};

const getModelCardImageComponent = (model: Model) => {
    const image = model.images[0] as Image | undefined;
    switch (image?.type) {
        case 'paired': {
            if (image.thumbnail) {
                return (
                    <img
                        alt={model.name}
                        className="margin-auto z-0 h-full w-full object-cover"
                        loading="lazy"
                        src={image.thumbnail}
                    />
                );
            }
            return (
                <SideBySideImage
                    image={image}
                    model={model}
                />
            );
        }
        case 'standalone': {
            const imageSrc = image.thumbnail || image.url;
            return (
                <img
                    alt={model.name}
                    className="margin-auto z-0 h-full w-full object-cover"
                    loading="lazy"
                    src={imageSrc}
                />
            );
        }
        default:
            return <div className="margin-auto z-0 w-full text-center">No Image</div>;
    }
};

// eslint-disable-next-line react/display-name
export const ModelCardContent = memo(({ id, model }: BaseModelCardProps) => {
    const { userData } = useUsers();
    const { archData } = useArchitectures();

    const { webApi, editMode } = useWebApi();
    const { updateModelProperty } = useUpdateModel(webApi, id);

    const description = fixDescription(model.description, model.scale);

    return (
        <div className={style.inner}>
            {/* Arch tag on image */}
            <div className={style.topTags}>
                <AccentTag>{archData.get(model.architecture)?.name ?? 'Unknown'}</AccentTag>
                <AccentTag>{model.scale}x</AccentTag>
            </div>

            <Link
                className={joinClasses(
                    style.thumbnail,
                    'relative flex h-full w-full items-center justify-items-center overflow-hidden bg-fade-300 align-middle dark:bg-fade-700 '
                )}
                href={`/models/${id}`}
                tabIndex={-1}
            >
                {getModelCardImageComponent(model)}
            </Link>

            <div className={style.details}>
                <Link
                    className={`${style.name} block text-xl font-bold text-gray-800 dark:text-gray-100`}
                    href={`/models/${id}`}
                >
                    {model.name}
                </Link>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {'by '}
                    {joinList(
                        asArray(model.author).map((userId) => (
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
                <div className="mb-1 py-1 text-sm text-gray-600 line-clamp-3 dark:text-gray-400">{description}</div>

                {/* Tags */}
                <div className="flex flex-row flex-wrap gap-1 text-xs">
                    <EditableTags
                        readonly={!editMode}
                        tags={model.tags}
                        onChange={(tags) => updateModelProperty('tags', tags)}
                    />
                </div>
            </div>
        </div>
    );
});

export const ModelCard = memo(({ id, model, lazy = false }: ModelCardProps) => {
    const inner = (
        <div
            className={`${style.modelCard} border-gray-300 bg-white shadow-lg hover:shadow-xl dark:border-gray-700 dark:bg-fade-900`}
        >
            <ModelCardContent
                id={id}
                model={model}
            />
        </div>
    );

    if (!lazy) return inner;

    return (
        <LazyLoadComponent
            placeholder={
                <div
                    className={`${style.modelCard} border-gray-300 bg-white shadow-lg hover:shadow-xl dark:border-gray-700 dark:bg-fade-900`}
                />
            }
        >
            {inner}
        </LazyLoadComponent>
    );
});

function fixDescription(description: string, scale: number): string {
    const lines = description.split('\n');
    const descLines: string[] = [];
    let category = '',
        purpose = '',
        pretrained = '',
        dataset = '';
    lines.forEach((line) => {
        if (line.startsWith('Category: ')) {
            category = String(line).replace('Category: ', '');
        } else if (line.startsWith('Purpose: ')) {
            purpose = String(line).replace('Purpose: ', '');
        } else if (line.startsWith('Pretrained: ')) {
            pretrained = String(line).replace('Pretrained: ', '');
        } else if (line.startsWith('Dataset: ')) {
            dataset = String(line).replace('Dataset: ', '');
        } else if (line !== '') {
            descLines.push(line.trim());
        }
    });
    const purposeSentence = category ? `A ${scale}x model for ${purpose}.` : `A ${scale}x model.`;
    const datasetSentence = dataset ? `Trained on ${dataset}.` : 'Unknown training dataset.';
    const pretrainedSentence = pretrained ? `Pretrained using ${pretrained}.` : 'Unknown pretrained model.';
    const actualDescription =
        descLines.length > 0
            ? descLines.join('\n').trim()
            : `${purposeSentence} ${datasetSentence} ${pretrainedSentence}`;
    return actualDescription;
}

function AccentTag({ children }: React.PropsWithChildren<unknown>) {
    return <div className={`${style.tagBase} bg-accent-600 text-sm text-gray-100`}>{children}</div>;
}
