import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { Image } from '../../lib/schema';
import { ImageComparison } from './carousel/comparison';

type ImageCarouselImageProps = {
    image: Image;
};

export const ImageCarouselImage = ({ image }: ImageCarouselImageProps) => {
    switch (image.type) {
        case 'paired':
            return <ImageComparison image={image} />;
        case 'standalone':
            return (
                // eslint-disable-next-line @next/next/no-img-element
                // <img
                //     alt="image"
                //     className="h-full w-full object-scale-down"
                //     src={image.url}
                // />
                <TransformWrapper>
                    <TransformComponent>
                        <img
                            alt="image"
                            src={image.url}
                        />
                    </TransformComponent>
                </TransformWrapper>
            );
        default:
            return null;
    }
};
