import { Image } from '../../lib/schema';
import { assertNever } from '../../lib/util';
import { ImageComparison } from './carousel/comparison';
import { ImageStandalone } from './carousel/standalone';
import styles from './image-carousel-image.module.scss';

type ImageCarouselImageProps = {
    image: Image;
};

function getImageComponent(image: Image) {
    switch (image.type) {
        case 'paired':
            return <ImageComparison image={image} />;
        case 'standalone':
            return <ImageStandalone image={image} />;
        default:
            return assertNever(image);
    }
}

export const ImageCarouselImage = ({ image }: ImageCarouselImageProps) => {
    const inner = getImageComponent(image);

    const caption = image.caption;
    if (caption) {
        return (
            <div className="relative">
                <div className="flex h-full w-full">{inner}</div>
                <span
                    className={`${styles.caption} pointer-events-none absolute select-none px-3 py-1 text-lg font-medium`}
                >
                    {caption}
                </span>
            </div>
        );
    } else {
        return inner;
    }
};
