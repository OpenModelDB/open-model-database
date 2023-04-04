import { ReactCompareSlider, ReactCompareSliderHandle, ReactCompareSliderImage } from 'react-compare-slider';
import { Image } from '../../lib/schema';

type ImageCarouselImageProps = {
    image: Image;
};

export const ImageCarouselImage = ({ image }: ImageCarouselImageProps) => {
    switch (image.type) {
        case 'paired':
            return (
                <ReactCompareSlider
                    className="w-full rounded-lg"
                    handle={
                        <ReactCompareSliderHandle
                            buttonStyle={{
                                height: '48px',
                                width: '12px',
                                borderRadius: '1rem',
                                backdropFilter: undefined,
                                background: 'white',
                                border: 0,
                                color: 'transparent',
                                overflow: 'hidden',
                            }}
                        />
                    }
                    itemOne={
                        <ReactCompareSliderImage
                            alt="LR"
                            className="rendering-pixelated h-full w-full object-scale-down"
                            src={image.LR}
                        />
                    }
                    itemTwo={
                        <ReactCompareSliderImage
                            alt="HR"
                            className="rendering-pixelated h-full w-full object-scale-down"
                            src={image.SR}
                        />
                    }
                />
            );
        case 'standalone':
            return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    alt="image"
                    className="h-full w-full object-scale-down"
                    src={image.url}
                />
            );
        default:
            return null;
    }
};
