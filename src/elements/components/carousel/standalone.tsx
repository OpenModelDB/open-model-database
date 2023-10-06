import { useEffect, useRef } from 'react';
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { StandaloneImage } from '../../../lib/schema';

type ImageStandaloneProps = {
    image: StandaloneImage;
};

export const ImageStandalone = ({ image }: ImageStandaloneProps) => {
    const imgRef = useRef<ReactZoomPanPinchRef | null>(null);

    useEffect(() => {
        imgRef.current?.centerView(1, 0);
    }, [image]);

    return (
        <TransformWrapper
            centerOnInit
            limitToBounds
            panning={{
                velocityDisabled: true,
            }}
            ref={imgRef}
        >
            <TransformComponent
                wrapperStyle={{
                    width: '100%',
                    height: '100%',
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    alt="image"
                    className="h-full w-full object-scale-down"
                    src={image.url}
                />
            </TransformComponent>
        </TransformWrapper>
    );
};
