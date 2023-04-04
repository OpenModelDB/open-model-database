import { useState } from 'react';
import { AiFillEdit } from 'react-icons/ai';
import {
    BsCaretLeftFill,
    BsCaretRightFill,
    BsChevronLeft,
    BsChevronRight,
    BsFillTrashFill,
    BsPlusLg,
} from 'react-icons/bs';
import { Image } from '../../lib/schema';
import { joinClasses } from '../../lib/util';
import { EditImageButton } from './image-carousel-edit-popover';
import { ImageCarouselImage } from './image-carousel-image';

type ImageCarouselProps = {
    images: Image[];
    readonly: boolean;
    onChange?: (images: Image[]) => void;
};

export const ImageCarousel = ({ images, readonly, onChange }: ImageCarouselProps) => {
    const [imageIndex, setImageIndex] = useState(0);

    const selectedImage = images[imageIndex];

    return (
        <div className="relative rounded-lg">
            <div className="flex h-96 w-full rounded-lg bg-fade-100 align-middle dark:bg-fade-800">
                {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
                {selectedImage ? (
                    <ImageCarouselImage image={selectedImage} />
                ) : (
                    <div className="flex h-full w-full items-center align-middle">
                        <div className="m-auto">This model does not have preview images.</div>
                    </div>
                )}
            </div>
            <div className="space-between flex w-full py-2">
                <button
                    className="inline-flex cursor-pointer items-center rounded-lg border-0 bg-fade-200 p-2.5 text-center text-sm text-fade-900 transition duration-100 ease-in-out hover:bg-fade-300 focus:outline-none focus:ring-4 focus:ring-fade-700 dark:bg-fade-700 dark:text-white dark:hover:bg-fade-600 dark:focus:ring-fade-500"
                    onClick={() => {
                        setImageIndex((imageIndex + images.length - 1) % images.length);
                    }}
                >
                    <BsCaretLeftFill />
                </button>
                <div className="flex grow items-center justify-center justify-items-center gap-2 align-middle">
                    {images.map((image, index) => (
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
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                alt="Thumbnail"
                                className={joinClasses(
                                    'border-3 m-0 h-12 w-12 cursor-pointer rounded-lg border-solid p-0 transition duration-100 ease-in-out',
                                    index === imageIndex
                                        ? 'border-accent-500'
                                        : 'border-fade-200 hover:border-fade-300 dark:border-fade-700 dark:hover:border-fade-600'
                                )}
                                src={image.type === 'paired' ? image.SR : image.url}
                                onClick={() => {
                                    setImageIndex(index);
                                }}
                            />
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
                    ))}
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
                <button
                    className="inline-flex cursor-pointer items-center rounded-lg border-0 bg-fade-200 p-2.5 text-center text-sm text-fade-900 transition duration-100 ease-in-out hover:bg-fade-300 focus:outline-none focus:ring-4 focus:ring-fade-700 dark:bg-fade-700 dark:text-white dark:hover:bg-fade-600 dark:focus:ring-fade-500"
                    onClick={() => {
                        setImageIndex((imageIndex + 1) % images.length);
                    }}
                >
                    <BsCaretRightFill />
                </button>
            </div>
        </div>
    );
};
