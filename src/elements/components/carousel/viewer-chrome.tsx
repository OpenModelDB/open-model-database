import { MdAdd, MdRemove } from 'react-icons/md';
import { useIsTouch } from '../../../lib/hooks/use-is-touch';
import { joinClasses } from '../../../lib/util';
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
 * Anchored bottom-left as one group. Image captions are pinned to the
 * bottom-right corner, and plenty of example images have their own text baked
 * into that corner too, so the controls must stay out of it.
 */
export function ZoomControls({ scale, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
    const isTouch = useIsTouch();

    return (
        <div className={style.bottomBar}>
            <div className={style.controls}>
                <button
                    aria-label="Zoom out"
                    className={style.button}
                    type="button"
                    onClick={onZoomOut}
                >
                    <MdRemove />
                </button>
                <span
                    aria-live="off"
                    className={style.readout}
                >
                    {Math.round(scale * 100)}%
                </span>
                <button
                    aria-label="Zoom in"
                    className={style.button}
                    type="button"
                    onClick={onZoomIn}
                >
                    <MdAdd />
                </button>
                <span
                    aria-hidden
                    className={style.divider}
                />
                <button
                    aria-label="Reset zoom and position"
                    className={joinClasses(style.button, style.resetButton)}
                    type="button"
                    onClick={onReset}
                >
                    Fit
                </button>
            </div>

            <span className={style.hint}>{isTouch ? 'Pinch to zoom' : 'Scroll to zoom'} · Drag to pan</span>
        </div>
    );
}
