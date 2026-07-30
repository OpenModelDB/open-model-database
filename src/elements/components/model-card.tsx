/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/display-name */
import React, { memo, useRef, useState } from 'react';
import { MdCollections } from 'react-icons/md';
import { LazyLoadComponent } from 'react-lazy-load-image-component';
import { useArchitectures } from '../../lib/hooks/use-architectures';
import { useDevicePixelRatio } from '../../lib/hooks/use-device-pixel-ratio';
import { useUpdateModel } from '../../lib/hooks/use-update-model';
import { useUsers } from '../../lib/hooks/use-users';
import { useWebApi } from '../../lib/hooks/use-web-api';
import { joinList } from '../../lib/react-util';
import { Collection, CollectionId, ImageSize, Model, ModelId, PairedThumbnail } from '../../lib/schema';
import { getTextDescription } from '../../lib/text-description';
import { asArray, assertNever, joinClasses } from '../../lib/util';
import { ClampedTags } from './clamped-tags';
import { EditableTags } from './editable-tags';
import { Link } from './link';
import style from './model-card.module.scss';

export interface ModelCardProps {
    id: ModelId;
    model: Model;
    lazy?: boolean;
}
export interface CollectionCardProps {
    id: CollectionId;
    collection: Collection;
    preview: Model | undefined;
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

const SideBySideImage = ({ model, image }: { model: Model; image: PairedThumbnail }) => {
    const [lrDimensions, setLrDimensions] = useState(image.LRSize ?? EMPTY_SIZE);
    const [srDimensions, setSrDimensions] = useState(image.SRSize ?? EMPTY_SIZE);

    const maxHeight = Math.max(lrDimensions.height, srDimensions.height);
    const maxWidth = Math.max(lrDimensions.width, srDimensions.width);

    const lrRef = useRef<HTMLImageElement>(null);
    const srRef = useRef<HTMLImageElement>(null);

    const dpr = useDevicePixelRatio();
    // The goal of this scale is to ensure that the image is rendered as an integer scale (e.g. 100%, 200%, 300%).
    // This is necessary to prevent scaling artifacts. Such artifacts are especially noticeable for 1x models.
    // Here is how the scale is calculated:
    // 1. `1/dpr` scales the image such that 1px in the image is 1px on the screen.
    // 2. `Math.round(dpr + 0.16)` rounds the dpr to the nearest integer. Importantly, it rounds .35 up.
    //    This guarantees that we show at most 1.35x the original image size.
    // 3. `Math.max(1, ...)` ensures that the scale is at least 1. A scale of 0 would cause the image to disappear.
    const scale = (1 / dpr) * Math.max(1, Math.round(dpr + 0.16));

    return (
        <div className="relative flex h-full w-full">
            {/* Marks the seam so the card reads as a before/after pair. */}
            <div
                aria-hidden
                className="absolute top-0 left-1/2 z-10 h-full w-px -translate-x-1/2 bg-white/40 mix-blend-overlay"
            />
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

const getModelCardImageComponent = (model: Model | undefined) => {
    const image = model?.thumbnail ?? model?.images[0];
    if (!model || !image) {
        return (
            <div className="z-0 flex h-full w-full items-center justify-center text-sm text-ink-subtle">No preview</div>
        );
    }
    switch (image.type) {
        case 'paired': {
            return (
                <SideBySideImage
                    image={image}
                    model={model}
                />
            );
        }
        case 'standalone': {
            const imageSrc = image.url;
            return (
                <img
                    alt={model.name}
                    className="z-0 h-full w-full object-cover"
                    loading="lazy"
                    src={imageSrc}
                />
            );
        }
        default:
            return assertNever(image);
    }
};

// eslint-disable-next-line react/display-name
const ModelCardContent = memo(({ id, model }: ModelCardProps) => {
    const { userData } = useUsers();
    const { archData } = useArchitectures();

    const { webApi, editMode } = useWebApi();
    const { updateModelProperty } = useUpdateModel(webApi, id);

    const description = getTextDescription(model);

    return (
        <div className={style.inner}>
            {/* Architecture and scale, over the image */}
            <div className={style.topTags}>
                <OverlayTag>{archData.get(model.architecture)?.name ?? 'Unknown'}</OverlayTag>
                <OverlayTag emphasis>{model.scale}x</OverlayTag>
            </div>

            <Link
                className={joinClasses(style.thumbnail, 'bg-surface-sunken')}
                href={`/models/${id}`}
                tabIndex={-1}
            >
                {getModelCardImageComponent(model)}
            </Link>

            <div className={style.details}>
                <Link
                    className={`${style.name} block text-base font-semibold leading-snug text-ink line-clamp-2`}
                    href={`/models/${id}`}
                >
                    {model.name}
                </Link>
                <div className="truncate text-sm text-ink-muted">
                    {'by '}
                    {joinList(
                        asArray(model.author).map((userId) => (
                            <Link
                                className="font-medium text-accent-text hover:underline"
                                href={`/users/${userId}`}
                                key={userId}
                            >
                                {userData.get(userId)?.name ?? `unknown user:${userId}`}
                            </Link>
                        ))
                    )}
                </div>

                {/* Description */}
                <div className="mt-1 mb-2 text-sm leading-snug text-ink-muted line-clamp-2">{description}</div>

                {/* Tags. Edit mode keeps the full editor — its popover lists
                    every tag with its selected state, so the clamp below never
                    puts a tag out of reach. */}
                {editMode ? (
                    <div className={joinClasses(style.tagRow, 'text-xs')}>
                        <EditableTags
                            readonly={false}
                            tags={model.tags}
                            onChange={(tags) => updateModelProperty('tags', tags)}
                        />
                    </div>
                ) : (
                    <ClampedTags
                        className={joinClasses(style.tagRow, 'text-xs')}
                        tags={model.tags}
                    />
                )}
            </div>
        </div>
    );
});

// eslint-disable-next-line react/display-name
const CollectionCardContent = memo(({ id, collection, preview }: CollectionCardProps) => {
    const { userData } = useUsers();

    return (
        <div className={style.inner}>
            <div className={style.topTags}>
                <OverlayTag>
                    <MdCollections
                        aria-hidden
                        className="mr-1 inline-block align-middle"
                    />
                    Collection
                </OverlayTag>
            </div>

            <Link
                className={joinClasses(style.thumbnail, 'bg-surface-sunken')}
                href={`/collections/${id}`}
                tabIndex={-1}
            >
                {getModelCardImageComponent(preview)}
            </Link>

            <div className={style.details}>
                <Link
                    className={`${style.name} block text-base font-semibold leading-snug text-ink line-clamp-2`}
                    href={`/collections/${id}`}
                >
                    {collection.name}
                </Link>
                <div className="truncate text-sm text-ink-muted">
                    {'by '}
                    {joinList(
                        asArray(collection.author).map((userId) => (
                            <Link
                                className="font-medium text-accent-text hover:underline"
                                href={`/users/${userId}`}
                                key={userId}
                            >
                                {userData.get(userId)?.name ?? `unknown user:${userId}`}
                            </Link>
                        ))
                    )}
                </div>

                {/* Description */}
                <div className="mt-1 mb-2 text-sm leading-snug text-ink-muted line-clamp-2">
                    {collection.description}
                </div>
            </div>
        </div>
    );
});

const useMakeLazyCard = (lazy: boolean, card: JSX.Element) => {
    const { editMode } = useWebApi();

    const inner = <div className={joinClasses(style.modelCard, !editMode && style.overflowHidden)}>{card}</div>;

    if (!lazy) return inner;

    return <LazyLoadComponent placeholder={<div className={style.modelCard} />}>{inner}</LazyLoadComponent>;
};

export const ModelCard = memo(({ id, model, lazy = false }: ModelCardProps) => {
    return useMakeLazyCard(
        lazy,
        <ModelCardContent
            id={id}
            model={model}
        />
    );
});

export const CollectionCard = memo(({ id, collection, preview, lazy = false }: CollectionCardProps) => {
    return useMakeLazyCard(
        lazy,
        <CollectionCardContent
            collection={collection}
            id={id}
            preview={preview}
        />
    );
});

/**
 * A chip that sits directly on top of a thumbnail, so it needs to stay legible
 * over arbitrary image content. `emphasis` marks the scale, which is the
 * property people filter on first.
 */
function OverlayTag({ children, emphasis }: React.PropsWithChildren<{ emphasis?: boolean }>) {
    return (
        <div
            className={joinClasses(
                style.tagBase,
                'backdrop-blur-sm',
                emphasis ? 'bg-accent-600 text-white' : 'bg-fade-900/70 text-fade-100'
            )}
        >
            {children}
        </div>
    );
}
