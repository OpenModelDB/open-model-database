import { createContext, useContext, useEffect, useState } from 'react';

const DevicePixelRatioContext = createContext(1);

export function DevicePixelRatioProvider({ children }: React.PropsWithChildren<unknown>) {
    const [value, setValue] = useState(1);

    useEffect(() => {
        setValue(window.devicePixelRatio);
    }, []);

    useEffect(() => {
        console.log(value);
        const update = () => setValue(window.devicePixelRatio);
        const mediaMatcher = window.matchMedia(`screen and (resolution: ${value}dppx)`);
        mediaMatcher.addEventListener('change', update);

        return () => {
            mediaMatcher.removeEventListener('change', update);
        };
    }, [value]);

    return <DevicePixelRatioContext.Provider value={value}>{children}</DevicePixelRatioContext.Provider>;
}

export const useDevicePixelRatio = (): number => {
    return useContext(DevicePixelRatioContext);
};
