import '../styles/globals.scss';
import 'react-tooltip/dist/react-tooltip.css';
import { DevicePixelRatioProvider } from '../lib/hooks/use-device-pixel-ratio';
import { TooltipProvider } from '../lib/hooks/use-tooltip';
import { WebApiProvider } from '../lib/hooks/use-web-api';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <WebApiProvider>
            <DevicePixelRatioProvider>
                <TooltipProvider>
                    <Component {...pageProps} />
                </TooltipProvider>
            </DevicePixelRatioProvider>
        </WebApiProvider>
    );
}
