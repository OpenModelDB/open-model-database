import { Image, PairedImage, StandaloneImage } from './schema';

export type GetDocument = (url: string) => Promise<Document>;

export async function getDocumentBrowser(url: string): Promise<Document> {
    const html = await fetch(`https://cors-anywhere.herokuapp.com/${url}`).then((res) => res.text());
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // add base tag to make relative urls work
    const base = doc.createElement('base');
    base.href = url;
    doc.head.appendChild(base);

    return doc;
}

function getImgsliSimplePair(document: Document): PairedImage {
    const url = document.baseURI;

    const before = document.querySelector<HTMLImageElement>('.ImageComparer .before img');
    const after = document.querySelector<HTMLImageElement>('.ImageComparer img.after');

    if (!before || !after) {
        throw new Error('Could not find images');
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const beforeUrl = new URL(before.dataset.lazySrc!, url).toString();
    const afterUrl = new URL(after.src, url).toString();

    return {
        type: 'paired',
        LR: beforeUrl,
        SR: afterUrl,
    };
}

function getSlowPicInfo(document: Document) {
    const imageElements: NodeListOf<HTMLImageElement> = document.querySelectorAll('#preload-images img');
    const images = [...imageElements].map((i) => i.src);
    const imageNames = [...imageElements].map((i) => i.alt);

    const anchors: NodeListOf<HTMLAnchorElement> = document.querySelectorAll(
        'div.dropdown-menu[aria-labelledby=comparisons] > a'
    );
    const links = [...anchors].map((a) => a.href);

    return { images, imageNames, links };
}
function getSlowPicSimplePair(document: Document): PairedImage {
    const { images } = getSlowPicInfo(document);

    if (images.length !== 2) {
        throw new Error('Only 2 are supported');
    }

    return {
        type: 'paired',
        LR: images[0],
        SR: images[1],
    };
}

function getImgBoxImage(document: Document): StandaloneImage {
    const img = document.querySelector<HTMLImageElement>('img#img');

    if (!img) {
        throw new Error('Cannot find image');
    }

    const url = img.src;
    // The URL format is as follows:
    // Full:  https://images2.imgbox.com/cc/e1/i20G62sv_o.png
    // Thumb: https://thumbs2.imgbox.com/cc/e1/i20G62sv_t.png
    const thumbnail = url.replace('https://images2.imgbox.com', 'https://thumbs2.imgbox.com').replace('_o.', '_t.');

    return {
        type: 'standalone',
        url,
        thumbnail,
        caption: img.title,
    };
}

export async function extractImage(url: string, getDocument: GetDocument = getDocumentBrowser): Promise<Image> {
    if (
        url.startsWith('https://i.imgur.com/') ||
        url.startsWith('https://cdn.discordapp.com/') ||
        url.startsWith('https://imgsli.com/i/')
    ) {
        return { type: 'standalone', url };
    }
    if (url.startsWith('https://media.discordapp.net/')) {
        return {
            type: 'standalone',
            url: url.replace('https://media.discordapp.net/', 'https://cdn.discordapp.com/').replace(/\?.*$/, ''),
        };
    }

    if (url.startsWith('https://imgsli.com/')) {
        return getImgsliSimplePair(await getDocument(url));
    }
    if (url.startsWith('https://slow.pics/')) {
        return getSlowPicSimplePair(await getDocument(url));
    }
    if (url.startsWith('https://imgbox.com/')) {
        return getImgBoxImage(await getDocumentBrowser(url));
    }

    throw new Error('Unknown url');
}
