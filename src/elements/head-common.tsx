import Head from 'next/head';
import { useCurrentPath } from '../lib/hooks/use-current-path';
import { SITE_URL } from '../lib/site-data';

export interface SiteMetaProps {
    title: string;
    description?: string;
    image?: string;
    noTitlePrefix?: boolean;
    noIndex?: boolean;
}

export function HeadCommon({
    title,
    description,
    image = `${SITE_URL}/assets/OpenModelDB_Jelly.png`,
    noTitlePrefix = false,
    noIndex = false,
}: SiteMetaProps) {
    const relPath = useCurrentPath();

    return (
        <Head>
            <title>{title + (noTitlePrefix ? '' : ' - OpenModelDB')}</title>
            <meta
                content={description}
                name="description"
            />
            <meta
                content="width=device-width, initial-scale=1"
                name="viewport"
            />
            <link
                href="/favicon.ico"
                rel="icon"
            />
            <meta
                content={title}
                property="og:title"
            />
            <meta
                content={description}
                property="og:description"
            />
            <meta
                content={SITE_URL + relPath}
                property="og:url"
            />
            <meta
                content="website"
                property="og:type"
            />
            <meta
                content={image}
                property="og:image"
            />
            <meta
                content="OpenModelDB"
                property="og:site_name"
            />
            <meta
                content="#4d48a9"
                name="theme-color"
            />
            {noIndex && (
                <meta
                    content="noindex"
                    name="robots"
                />
            )}
        </Head>
    );
}
