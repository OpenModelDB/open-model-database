import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { StandaloneImage } from '../../../lib/schema';
import { ZoomControls } from './viewer-chrome';

type ImageStandaloneProps = {
    image: StandaloneImage;
};

export const ImageStandalone = ({ image }: ImageStandaloneProps) => {
    const imgRef = useRef<ReactZoomPanPinchRef | null>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        imgRef.current?.centerView(1, 0);
        setScale(1);
    }, [image]);

    const zoomIn = useCallback(() => imgRef.current?.zoomIn(0.2, 0), []);
    const zoomOut = useCallback(() => imgRef.current?.zoomOut(0.2, 0), []);
    const reset = useCallback(() => imgRef.current?.centerView(1, 0), []);

    return (
        <div className="relative h-full w-full">
            <TransformWrapper
                centerOnInit
                limitToBounds
                panning={{
                    velocityDisabled: true,
                }}
                ref={imgRef}
                onTransformed={(_ref, state) => setScale(state.scale)}
            >
                <TransformComponent
                    // The content box needs an explicit size: the image below is
                    // sized in percentages, so without one the box resolves to
                    // zero height and nothing renders or zooms.
                    contentStyle={{
                        width: '100%',
                        height: '100%',
                    }}
                    wrapperStyle={{
                        width: '100%',
                        height: '100%',
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        alt={image.caption || 'Model output example'}
                        className="h-full w-full object-scale-down"
                        src={image.url}
                    />
                </TransformComponent>
            </TransformWrapper>

            <ZoomControls
                scale={scale}
                onReset={reset}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
            />
        </div>
    );
};
