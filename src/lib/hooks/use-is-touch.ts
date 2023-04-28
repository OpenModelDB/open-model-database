import { useEffect, useState } from 'react';

function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function useIsTouch(initial = false): boolean {
    const [isTouch, setIsTouch] = useState(initial);

    useEffect(() => setIsTouch(isTouchDevice()), []);

    return isTouch;
}
