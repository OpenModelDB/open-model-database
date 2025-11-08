import { Inter } from 'next/font/google';
import { useEffect } from 'react';
import '../styles/globals.scss';
import 'react-tooltip/dist/react-tooltip.css';
import { DevicePixelRatioProvider } from '../lib/hooks/use-device-pixel-ratio';
import { TooltipProvider } from '../lib/hooks/use-tooltip';
import { WebApiProvider } from '../lib/hooks/use-web-api';
import type { AppProps } from 'next/app';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

export default function App({ Component, pageProps }: AppProps) {
    useEffect(() => {
        // Ensure the font variable is available on the root element
        document.documentElement.style.setProperty('--font-inter', inter.style.fontFamily);
    }, []);

    return (
        <div className={inter.variable}>
            <WebApiProvider>
                <DevicePixelRatioProvider>
                    <TooltipProvider>
                        <Component {...pageProps} />
                    </TooltipProvider>
                </DevicePixelRatioProvider>
            </WebApiProvider>
        </div>
    );
}
