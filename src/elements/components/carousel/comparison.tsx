import { useEffect, useRef, useState } from 'react';
import { ReactCompareSlider, ReactCompareSliderHandle, ReactCompareSliderImage } from 'react-compare-slider';
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { Image } from '../../../lib/schema';

type ImageComparisonProps = {
    image: Image;
};

export const ImageComparison = ({ image }: ImageComparisonProps) => {
    const [handlePosition, setHandlePosition] = useState(50);

    const lrRef = useRef<ReactZoomPanPinchRef | null>(null);
    const srRef = useRef<ReactZoomPanPinchRef | null>(null);

    const [transformState, setTransformState] = useState({
        positionX: 0,
        positionY: 0,
        scale: 1,
    });
    const prevTransformStateRef = useRef(transformState);

    useEffect(() => {
        const prevTransformState = prevTransformStateRef.current;
        if (
            transformState.positionX !== prevTransformState.positionX ||
            transformState.positionY !== prevTransformState.positionY ||
            transformState.scale !== prevTransformState.scale
        ) {
            if (lrRef.current) {
                lrRef.current.setTransform(transformState.positionX, transformState.positionY, transformState.scale, 0);
            }
            if (srRef.current) {
                srRef.current.setTransform(transformState.positionX, transformState.positionY, transformState.scale, 0);
            }
        }
        prevTransformStateRef.current = transformState;
    }, [transformState]);

    useEffect(() => {
        lrRef.current?.centerView(1, 0);
        srRef.current?.centerView(1, 0);
        setHandlePosition(50);
    }, [image]);

    if (image.type !== 'paired') {
        return null;
    }

    return (
        <ReactCompareSlider
            onlyHandleDraggable
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
                <TransformWrapper
                    centerOnInit
                    disablePadding
                    limitToBounds
                    initialPositionX={transformState.positionX}
                    initialPositionY={transformState.positionY}
                    initialScale={transformState.scale}
                    minScale={0.1}
                    panning={{
                        velocityDisabled: true,
                    }}
                    ref={lrRef}
                    wheel={{
                        step: 0.2 * transformState.scale,
                    }}
                    onTransformed={(ref, state) => {
                        setTransformState(state);
                    }}
                >
                    <TransformComponent
                        contentStyle={{
                            width: 'auto',
                            height: 'auto',
                        }}
                        wrapperStyle={{
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        <ReactCompareSliderImage
                            alt="LR"
                            className="rendering-pixelated"
                            src={image.LR}
                        />
                    </TransformComponent>
                </TransformWrapper>
            }
            itemTwo={
                <TransformWrapper
                    centerOnInit
                    disablePadding
                    limitToBounds
                    initialPositionX={transformState.positionX}
                    initialPositionY={transformState.positionY}
                    initialScale={transformState.scale}
                    minScale={0.1}
                    panning={{
                        velocityDisabled: true,
                    }}
                    ref={srRef}
                    wheel={{
                        step: 0.2 * transformState.scale,
                    }}
                    onTransformed={(ref, state) => {
                        setTransformState(state);
                    }}
                >
                    <TransformComponent
                        contentStyle={{
                            width: 'auto',
                            height: 'auto',
                        }}
                        wrapperStyle={{
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        <ReactCompareSliderImage
                            alt="SR"
                            className="rendering-pixelated"
                            src={image.SR}
                        />
                    </TransformComponent>
                </TransformWrapper>
            }
            position={handlePosition}
            onPositionChange={setHandlePosition}
        />
    );
};
