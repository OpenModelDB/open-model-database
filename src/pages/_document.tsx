import { Head, Html, Main, NextScript } from 'next/document';
import Script from 'next/script';

// This little script will read the last theme from localStorage and assign it to the HTML element.
// This ensure that the website is always displayed with the correct them.
const themeInit =
    `document.documentElement.dataset.theme=` +
    `localStorage.getItem('theme')` +
    `||` +
    `(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light')`;

export default function Document() {
    return (
        <Html lang="en">
            <Head />
            <body>
                <Main />
                <NextScript />
                <Script
                    id="theme-init"
                    strategy="beforeInteractive"
                >
                    {themeInit}
                </Script>
            </body>
        </Html>
    );
}
