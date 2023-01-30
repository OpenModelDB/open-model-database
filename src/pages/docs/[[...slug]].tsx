import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { ParsedUrlQuery } from 'querystring';
import { Doc, DocPagePath, docPathToSlug } from 'src/lib/docs/doc';
import { SideBar, generateSideBar } from 'src/lib/docs/side-bar';
import { getAllDocPaths, getAllDocs, getManifest } from 'src/lib/server/docs';
import { hasOwn } from 'src/lib/util';

interface Params extends ParsedUrlQuery {
    slug?: string[];
}
interface Props {
    title: string;
    markdown: string;
    sideBar: SideBar;
}

export default function Page({ title, markdown, sideBar }: Props) {
    return (
        <>
            <Head>
                <title>{`${title} - OpenModelDB`}</title>
                <meta
                    content="width=device-width, initial-scale=1"
                    name="viewport"
                />
                <link
                    href="/favicon.ico"
                    rel="icon"
                />
            </Head>
            <main>
                <div>
                    <p>{title}</p>
                    <pre>{JSON.stringify(sideBar, undefined, 4)}</pre>
                    <br />
                    <pre>{markdown}</pre>
                </div>
            </main>
        </>
    );
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
    const mdPaths = await getAllDocPaths();
    const manifest = await getManifest();

    const paths = new Set(mdPaths.map(docPathToSlug));
    for (const from of Object.keys(manifest.redirects ?? {})) {
        if (!/^(?:[^./]+(?:\/[^./]+)*)?$/.test(from)) {
            console.error(`Ignoring redirect from ${from} because it is not a valid slug`);
            continue;
        }
        if (paths.has(from)) {
            console.error(`Ignoring redirect from ${from} because it shadows a MarkDown file with the same slug`);
            continue;
        }
        paths.add(from);
    }

    return {
        paths: [...paths].map((path) => {
            const segments = path.split(/\//g);
            return { params: { slug: segments } };
        }),
        fallback: false,
    };
};

export const getStaticProps: GetStaticProps<Props, Params> = async (context) => {
    const manifest = await getManifest();
    manifest.redirects ??= {};

    const slugSegments = context.params?.slug ?? [];
    const slug = slugSegments.join('/');

    if (hasOwn(manifest.redirects, slug)) {
        // redirect

        let destination = manifest.redirects[slug];
        if (!destination.startsWith('/')) {
            destination = `/docs/${destination}`;
        }
        return { redirect: { destination, permanent: false } };
    }

    const docs = await getAllDocs();
    const [docPath, doc] = getDocFromSlug(slug, docs);

    return {
        props: {
            title: doc.title,
            markdown: doc.markdown,
            sideBar: generateSideBar(manifest, docs, docPath),
        },
    };
};

function getDocFromSlug(slug: string, docs: ReadonlyMap<DocPagePath, Doc>): [DocPagePath, Doc] {
    const paths = slug.length === 0 ? ['index.md'] : [`${slug}/index.md`, `${slug}.md`];

    const candidates: [DocPagePath, Doc][] = [];
    for (const pathString of paths) {
        const path = pathString as DocPagePath;
        const d = docs.get(path);
        if (d) {
            candidates.push([path, d]);
        }
    }

    if (candidates.length === 0) {
        throw new Error(`Cannot find a Markdown file for the slug ${slug}`);
    }
    if (candidates.length > 1) {
        console.warn(
            `The slug ${slug} is ambiguous.` +
                ` It maps to following files: ${candidates.map((p) => `'${p[0]}'`).join(', ')}`
        );
    }

    return candidates[0];
}