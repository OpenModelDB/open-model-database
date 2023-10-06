/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/display-name */
import React, { memo, useEffect, useRef, useState } from 'react';
import { LazyLoadComponent } from 'react-lazy-load-image-component';
import { useArchitectures } from '../../lib/hooks/use-architectures';
import { useDevicePixelRatio } from '../../lib/hooks/use-device-pixel-ratio';
import { useUpdateModel } from '../../lib/hooks/use-update-model';
import { useUsers } from '../../lib/hooks/use-users';
import { useWebApi } from '../../lib/hooks/use-web-api';
import { joinList } from '../../lib/react-util';
import { Image, Model, ModelId, PairedImage } from '../../lib/schema';
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

interface Size {
    readonly height: number;
    readonly width: number;
}
const EMPTY_SIZE: Size = {
    height: 0,
    width: 0,
};
function getNaturalSize(image: HTMLImageElement): Size {
    return {
        height: image.naturalHeight,
        width: image.naturalWidth,
    };
}

const SideBySideImage = ({ model, image }: { model: Model; image: PairedImage }) => {
    const [lrDimensions, setLrDimensions] = useState(EMPTY_SIZE);
    const [srDimensions, setSrDimensions] = useState(EMPTY_SIZE);

    const maxHeight = Math.max(lrDimensions.height, srDimensions.height);
    const maxWidth = Math.max(lrDimensions.width, srDimensions.width);

    const lrRef = useRef<HTMLImageElement>(null);
    const srRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (lrRef.current) {
            setLrDimensions(getNaturalSize(lrRef.current));
        }
        if (srRef.current) {
            setSrDimensions(getNaturalSize(srRef.current));
        }
    }, []);

    const dpr = useDevicePixelRatio();
    // The goal of this scale is to ensure that the image is rendered as an integer scale (e.g. 100%, 200%, 300%).
    // This is necessary to prevent scaling artifacts. Such artifacts are especially noticeable for 1x models.
    // Here is how the scale is calculated:
    // 1. `1/dpr` scales the image such that 1px in the image is 1px on the screen.
    // 2. `Math.round(dpr - 0.01)` rounds the dpr to the nearest integer. Importantly, it rounds .5 down.
    // 3. `Math.max(1, ...)` ensures that the scale is at least 1. A scale of 0 would cause the image to disappear.
    const scale = (1 / dpr) * Math.max(1, Math.round(dpr - 0.01));

    return (
        <div className="flex h-full w-full">
            <div className="relative flex h-full w-1/2 content-center overflow-hidden align-middle">
                <img
                    alt={model.name}
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
                    alt={model.name}
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

const getModelCardImageComponent = (model: Model) => {
    const image = model.images[0] as Image | undefined;
    switch (image?.type) {
        case 'paired': {
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
    const isPaired = model.images[0]?.type === 'paired' && !editMode;

    return (
        <div className={style.inner}>
            {/* Arch tag on image */}
            <div className={style.topTags}>
                <AccentTag>{archData.get(model.architecture)?.name ?? 'Unknown'}</AccentTag>
                <AccentTag>{model.scale}x</AccentTag>
            </div>

            <Link
                className={joinClasses(style.thumbnail, isPaired && style.paired, 'bg-fade-300 dark:bg-fade-700 ')}
                href={`/models/${id}`}
                tabIndex={-1}
            >
                {getModelCardImageComponent(model)}
            </Link>

            <div className={joinClasses(style.details, isPaired && style.paired)}>
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
                <div className="mb-2 mt-1 text-sm text-gray-600 line-clamp-3 dark:text-gray-400">{description}</div>

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
    const { editMode } = useWebApi();

    const inner = (
        <div
            className={joinClasses(
                style.modelCard,
                !editMode && style.overflowHidden,
                'border-gray-300 bg-white shadow-lg hover:shadow-xl dark:border-gray-700 dark:bg-fade-900'
            )}
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
    const lines = description.trim().split('\n');
    const descLines: string[] = [];
    let purpose = '',
        pretrained = '';
    lines.forEach((line) => {
        if (line.startsWith('Category: ')) {
            // ignore category
        } else if (line.startsWith('Purpose: ')) {
            purpose = line.replace('Purpose: ', '');
        } else if (line.startsWith('Pretrained: ')) {
            pretrained = line.replace(/Pretrained: (?:Trained on )?/i, '');
        } else if (line !== '') {
            descLines.push(line.trim());
        }
    });
    if (!purpose && !pretrained && descLines.length > 0) {
        return descLines.join('\n');
    }
    const purposeSentence = purpose ? `A ${scale}x model for ${purpose}.` : `A ${scale}x model.`;
    const pretrainedSentence = pretrained ? `Pretrained using ${pretrained}.` : '';
    const actualDescription = `${purposeSentence} ${pretrainedSentence}\n${descLines.join('\n')}`.trim();
    return actualDescription;
}

function AccentTag({ children }: React.PropsWithChildren<unknown>) {
    return <div className={`${style.tagBase} bg-accent-600 text-sm text-gray-100`}>{children}</div>;
}
