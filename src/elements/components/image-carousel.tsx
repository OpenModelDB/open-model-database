import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AiFillEdit } from 'react-icons/ai';
import {
    BsCaretLeftFill,
    BsCaretRightFill,
    BsChevronLeft,
    BsChevronRight,
    BsFillTrashFill,
    BsPlusLg,
} from 'react-icons/bs';
import { FiMoreHorizontal } from 'react-icons/fi';
import { useWindowSize } from '../../lib/hooks/use-window-size';
import { Image } from '../../lib/schema';
import { joinClasses } from '../../lib/util';
import { CarouselChromeProvider } from './carousel/chrome-context';
import { FullscreenButton } from './carousel/viewer-chrome';
import { EditImageButton } from './image-carousel-edit-popover';
import { ImageCarouselImage } from './image-carousel-image';
import style from './image-carousel.module.scss';
import { EmptyStage } from './model-page/empty-stage';

type ImageCarouselProps = {
    images: readonly Image[];
    indexKey?: unknown;
    readonly: boolean;
    onChange?: (images: Image[]) => void;
};

const IMG_THUMB_SIZE = 96;

const CAROUSEL_ARROW =
    'inline-flex cursor-pointer items-center rounded-control border border-solid border-line bg-surface p-2 text-center text-sm text-ink transition-colors duration-100 ease-in-out hover:border-line-strong hover:bg-surface-hover';

export const ImageCarousel = ({ images, readonly, indexKey, onChange }: ImageCarouselProps) => {
    const [imageIndex, setImageIndex] = useState(0);
    useEffect(() => {
        setImageIndex((index) => (images.length === 0 ? 0 : Math.min(index, images.length - 1)));
    }, [images]);
    useEffect(() => {
        setImageIndex(0);
    }, [indexKey]);

    const selectedImage = images[imageIndex] as Image | undefined;

    const { width } = useWindowSize();

    const numImages = Math.min(Math.floor((width ?? IMG_THUMB_SIZE) / IMG_THUMB_SIZE), 12);

    const page = Math.floor(imageIndex / numImages);
    const sliceStartIndex = page * numImages;
    const sliceEndIndex = Math.min(sliceStartIndex + numImages, images.length);

    const stageRef = useRef<HTMLDivElement>(null);
    const [zoomSlot, setZoomSlot] = useState<HTMLDivElement | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    // Resolved in an effect, not during render: this page is statically
    // exported, so `document` does not exist on the first pass and reading it
    // inline would desync hydration.
    const [canFullscreen, setCanFullscreen] = useState(false);

    useEffect(() => {
        setCanFullscreen(document.fullscreenEnabled);

        const onChange = () => setIsFullscreen(document.fullscreenElement === stageRef.current);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {
                /* already exited, or the browser refused */
            });
        } else {
            stageRef.current?.requestFullscreen().catch(() => {
                /* refused, e.g. not from a user gesture */
            });
        }
    }, []);

    // The toolbar stays in fullscreen so images remain switchable there; it
    // just floats over the picture instead of sitting under it.
    const chrome = useMemo(() => ({ zoomSlot, overlay: isFullscreen }), [zoomSlot, isFullscreen]);

    // Unchanged from when this governed the whole rail: a single image needs no
    // thumbnails, but edit mode must keep rendering so `Add image` stays
    // reachable. Do not narrow it.
    const showThumbnails = !readonly || images.length > 1;
    const showToolbar = selectedImage !== undefined || !readonly;

    return (
        <CarouselChromeProvider value={chrome}>
            <div className="relative w-full">
                <div
                    className={joinClasses(
                        style.stage,
                        'w-full overflow-hidden rounded-card border border-solid border-line bg-surface-sunken'
                    )}
                    data-fullscreen={isFullscreen || undefined}
                    ref={stageRef}
                >
                    {selectedImage ? (
                        <div className={joinClasses(style.imageArea, 'flex w-full align-middle')}>
                            <ImageCarouselImage image={selectedImage} />
                        </div>
                    ) : (
                        <EmptyStage />
                    )}
                    {showToolbar && (
                        // Zoom docked left, thumbnails centred, fullscreen right.
                        // Sits inside the stage card so it reads as the image's
                        // controls rather than as a detached row below it.
                        <div
                            className={joinClasses(
                                style.toolbar,
                                'w-full border-x-0 border-b-0 border-t border-solid border-line px-3 py-3'
                            )}
                            data-overlay={isFullscreen || undefined}
                        >
                            <div
                                className={style.toolbarStart}
                                ref={setZoomSlot}
                            />

                            <div
                                className={joinClasses(
                                    style.toolbarCenter,
                                    'flex flex-wrap items-center justify-center gap-2 sm:gap-3'
                                )}
                            >
                                {showThumbnails && (
                                    <>
                                        {images.length >= 2 && (
                                            <button
                                                aria-label="Previous image"
                                                className={CAROUSEL_ARROW}
                                                type="button"
                                                onClick={() => {
                                                    setImageIndex((imageIndex + images.length - 1) % images.length);
                                                }}
                                            >
                                                <BsCaretLeftFill />
                                            </button>
                                        )}
                                        <div className="flex flex-wrap items-center justify-center justify-items-center gap-2 align-middle">
                                            {sliceStartIndex > 0 && (
                                                <div>
                                                    <FiMoreHorizontal />
                                                </div>
                                            )}
                                            {images.slice(sliceStartIndex, sliceEndIndex).map((image, actualIndex) => {
                                                const index = sliceStartIndex + actualIndex;
                                                return (
                                                    <div
                                                        className="flex flex-col items-center"
                                                        key={image.type === 'paired' ? image.SR : image.url}
                                                    >
                                                        {!readonly && (
                                                            <div className="flex flex-row items-center">
                                                                <EditImageButton
                                                                    image={image}
                                                                    onChange={(editedImage) => {
                                                                        const newImages = [...images];
                                                                        newImages[index] = editedImage;
                                                                        if (onChange) {
                                                                            onChange(newImages);
                                                                        }
                                                                    }}
                                                                >
                                                                    <AiFillEdit />
                                                                </EditImageButton>
                                                                <button
                                                                    className="block"
                                                                    onClick={() => {
                                                                        const newImages = [...images];
                                                                        // Remove image
                                                                        newImages.splice(index, 1);
                                                                        if (onChange) {
                                                                            onChange(newImages);
                                                                        }
                                                                    }}
                                                                >
                                                                    <BsFillTrashFill />
                                                                </button>
                                                            </div>
                                                        )}
                                                        <div
                                                            className={joinClasses(
                                                                'border-3 m-0 flex h-12 w-12 cursor-pointer overflow-hidden rounded-lg border-solid p-0 transition duration-100 ease-in-out',
                                                                index === imageIndex
                                                                    ? 'border-accent-500'
                                                                    : 'border-fade-200 hover:border-fade-300 dark:border-fade-700 dark:hover:border-fade-600'
                                                            )}
                                                            onClick={() => {
                                                                setImageIndex(index);
                                                            }}
                                                        >
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                alt={image.caption || 'Thumbnail'}
                                                                className="m-auto h-auto max-h-full w-auto max-w-full"
                                                                src={
                                                                    image.thumbnail ||
                                                                    (image.type === 'paired' ? image.LR : image.url)
                                                                }
                                                                title={image.caption}
                                                            />
                                                        </div>
                                                        {!readonly && (
                                                            <div className="flex flex-row items-center">
                                                                <button
                                                                    onClick={() => {
                                                                        const newImages = [...images];
                                                                        // Move image to the left
                                                                        newImages.splice(index, 1);
                                                                        newImages.splice(index - 1, 0, image);
                                                                        if (onChange) {
                                                                            onChange(newImages);
                                                                        }
                                                                    }}
                                                                >
                                                                    <BsChevronLeft />
                                                                </button>

                                                                <button
                                                                    onClick={() => {
                                                                        const newImages = [...images];
                                                                        // Move image to the right
                                                                        newImages.splice(index, 1);
                                                                        newImages.splice(index + 1, 0, image);
                                                                        if (onChange) {
                                                                            onChange(newImages);
                                                                        }
                                                                    }}
                                                                >
                                                                    <BsChevronRight />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {sliceEndIndex < images.length && (
                                                <div>
                                                    <FiMoreHorizontal />
                                                </div>
                                            )}
                                            {!readonly && (
                                                <EditImageButton
                                                    onChange={(newImage) => {
                                                        const newImages = [...images];
                                                        newImages.push(newImage);
                                                        if (onChange) {
                                                            onChange(newImages);
                                                        }
                                                    }}
                                                >
                                                    <BsPlusLg />
                                                </EditImageButton>
                                            )}
                                        </div>
                                        {images.length >= 2 && (
                                            <button
                                                aria-label="Next image"
                                                className={CAROUSEL_ARROW}
                                                type="button"
                                                onClick={() => {
                                                    setImageIndex((imageIndex + 1) % images.length);
                                                }}
                                            >
                                                <BsCaretRightFill />
                                            </button>
                                        )}
                                        {images.length >= 2 && (
                                            <span
                                                className={joinClasses(
                                                    'ml-1 text-sm tabular-nums',
                                                    // Over image pixels in fullscreen, where the
                                                    // muted ink token has no contrast to rely on.
                                                    isFullscreen ? 'text-white' : 'text-ink-muted'
                                                )}
                                            >
                                                {imageIndex + 1} / {images.length}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className={style.toolbarEnd}>
                                {selectedImage && canFullscreen && (
                                    <FullscreenButton
                                        isFullscreen={isFullscreen}
                                        overlay={isFullscreen}
                                        onClick={toggleFullscreen}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </CarouselChromeProvider>
    );
};
