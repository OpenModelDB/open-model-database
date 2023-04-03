import '../styles/globals.scss';
import 'react-tooltip/dist/react-tooltip.css';
import { WebApiProvider } from '../lib/hooks/use-web-api';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <WebApiProvider>
            <Component {...pageProps} />
        </WebApiProvider>
    );
}
