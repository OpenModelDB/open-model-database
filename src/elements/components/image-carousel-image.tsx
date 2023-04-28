import { Image } from '../../lib/schema';
import { ImageComparison } from './carousel/comparison';
import { ImageStandalone } from './carousel/standalone';

type ImageCarouselImageProps = {
    image: Image;
};

export const ImageCarouselImage = ({ image }: ImageCarouselImageProps) => {
    switch (image.type) {
        case 'paired':
            return <ImageComparison image={image} />;
        case 'standalone':
            return <ImageStandalone image={image} />;
        default:
            return null;
    }
};
