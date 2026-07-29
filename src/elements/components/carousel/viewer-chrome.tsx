import { createPortal } from 'react-dom';
import { MdAdd, MdFullscreen, MdFullscreenExit, MdRemove } from 'react-icons/md';
import { useIsTouch } from '../../../lib/hooks/use-is-touch';
import { joinClasses } from '../../../lib/util';
import { useCarouselChrome } from './chrome-context';
import style from './viewer-chrome.module.scss';

/**
 * Marks which half of a comparison is the model's input and which is its
 * output. Without these the slider is just a rectangle with a handle in it.
 */
export function CompareLabels() {
    return (
        <>
            <span className={joinClasses(style.label, style.labelBefore)}>Before</span>
            <span className={joinClasses(style.label, style.labelAfter)}>After</span>
        </>
    );
}

interface ZoomControlsProps {
    /** Zoom factor relative to the default fitted view. */
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
}

/**
 * Zoom and pan have always worked here, but nothing said so. This states the
 * gesture and gives it visible controls, which also makes the viewer usable
 * without a scroll wheel.
 *
 * Normally these dock into the carousel's toolbar, which keeps them off the
 * image entirely. In fullscreen there is no toolbar, so they overlay the image
 * anchored bottom-left — image captions own the bottom-right corner, and
 * plenty of example images have their own text baked into it too.
 */
export function ZoomControls({ scale, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
    const isTouch = useIsTouch();
    const { zoomSlot, overlay } = useCarouselChrome();
    const docked = zoomSlot !== null;
    // Themed only when docked into a toolbar that sits on a real surface.
    // Floating over image pixels — either as the fallback below or as the
    // fullscreen toolbar — keeps the original white-on-scrim treatment.
    const themed = docked && !overlay;

    const controls = (
        <div className={joinClasses(style.bottomBar, docked && style.bottomBarDocked)}>
            <div className={joinClasses(style.controls, themed && style.controlsDocked)}>
                <button
                    aria-label="Zoom out"
                    className={joinClasses(style.button, themed && style.buttonDocked)}
                    type="button"
                    onClick={onZoomOut}
                >
                    <MdRemove />
                </button>
                <span
                    aria-live="off"
                    className={joinClasses(style.readout, themed && style.readoutDocked)}
                >
                    {Math.round(scale * 100)}%
                </span>
                <button
                    aria-label="Zoom in"
                    className={joinClasses(style.button, themed && style.buttonDocked)}
                    type="button"
                    onClick={onZoomIn}
                >
                    <MdAdd />
                </button>
                <span
                    aria-hidden
                    className={joinClasses(style.divider, themed && style.dividerDocked)}
                />
                <button
                    aria-label="Reset zoom and position"
                    className={joinClasses(style.button, style.resetButton, themed && style.buttonDocked)}
                    type="button"
                    onClick={onReset}
                >
                    Fit
                </button>
            </div>

            {!docked && (
                <span className={style.hint}>{isTouch ? 'Pinch to zoom' : 'Scroll to zoom'} · Drag to pan</span>
            )}
        </div>
    );

    return zoomSlot ? createPortal(controls, zoomSlot) : controls;
}

/**
 * Sits at the toolbar's right edge and toggles both ways. Rendered by the
 * carousel rather than the viewer, because the element that goes fullscreen is
 * the stage that contains both of them.
 */
export function FullscreenButton({
    isFullscreen,
    overlay,
    onClick,
}: {
    isFullscreen: boolean;
    overlay: boolean;
    onClick: () => void;
}) {
    const label = isFullscreen ? 'Exit fullscreen' : 'View fullscreen';

    return (
        <button
            aria-label={label}
            className={joinClasses(style.fullscreenButton, overlay && style.fullscreenButtonOverlay)}
            title={label}
            type="button"
            onClick={onClick}
        >
            {isFullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
        </button>
    );
}
