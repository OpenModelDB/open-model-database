import { createContext, useContext } from 'react';

export interface CarouselChrome {
    /**
     * Element the viewer should portal its zoom controls into, or null to
     * render them overlaying the image.
     *
     * A portal rather than lifted state on purpose. `onTransformed` fires on
     * every frame of a pan or zoom, so hoisting the scale into the carousel
     * re-renders the whole stage — including the TransformWrapper being
     * dragged — and the viewer fights itself. Portaling moves only where the
     * controls land in the DOM; they stay inside the viewer's React subtree,
     * so its state and render cost are exactly what they were.
     */
    zoomSlot: HTMLElement | null;

    /**
     * True while the toolbar floats over the image itself, which it does in
     * fullscreen so the picture gets the whole screen. Theme tokens are
     * invisible against arbitrary photo pixels, so the controls switch back to
     * white-on-scrim there.
     */
    overlay: boolean;
}

const CarouselChromeContext = createContext<CarouselChrome>({ zoomSlot: null, overlay: false });

export const CarouselChromeProvider = CarouselChromeContext.Provider;

export function useCarouselChrome(): CarouselChrome {
    return useContext(CarouselChromeContext);
}
