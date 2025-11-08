import { useEffect, useRef, useState } from 'react';
import { ReactCompareSlider, ReactCompareSliderHandle, ReactCompareSliderImage } from 'react-compare-slider';
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { PairedImage } from '../../../lib/schema';

type ImageComparisonProps = {
    image: PairedImage;
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
    const imagesLoadedRef = useRef({ lr: false, sr: false });

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
        // Reset transform state when image changes
        setTransformState({
            positionX: 0,
            positionY: 0,
            scale: 1,
        });
        // Reset image load tracking
        imagesLoadedRef.current = { lr: false, sr: false };
        setHandlePosition(50);
    }, [image]);

    // Track image loading and center images once loaded
    useEffect(() => {
        // Center images function
        const centerImages = () => {
            if (lrRef.current && srRef.current) {
                // Use requestAnimationFrame to ensure DOM is updated
                requestAnimationFrame(() => {
                    lrRef.current?.centerView(1, 0);
                    srRef.current?.centerView(1, 0);
                });
            }
        };

        const lrImg = new Image();
        const srImg = new Image();
        let loadedCount = 0;

        const checkAndCenter = () => {
            loadedCount++;
            if (loadedCount === 2) {
                // Both images loaded, center them
                setTimeout(() => {
                    centerImages();
                }, 50); // Small delay to ensure DOM is ready
            }
        };

        lrImg.onload = () => {
            imagesLoadedRef.current.lr = true;
            checkAndCenter();
        };
        srImg.onload = () => {
            imagesLoadedRef.current.sr = true;
            checkAndCenter();
        };

        lrImg.src = image.LR;
        srImg.src = image.SR;

        // Fallback: center after a timeout even if images don't load
        const fallbackTimer = setTimeout(() => {
            centerImages();
        }, 500);

        return () => {
            clearTimeout(fallbackTimer);
        };
    }, [image]);

    return (
        <ReactCompareSlider
            key={`${image.LR}-${image.SR}`}
            onlyHandleDraggable
            className="react-compare-slider w-full"
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
