import { lstat, readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { simpleGit } from 'simple-git';
import { Doc, DocPagePath } from '../docs/doc';
import { Manifest } from '../docs/manifest';

export const DOCS_DIR = './docs/';

/**
 * Lists all markdown files in the docs folder.
 */
export async function getAllDocPaths(): Promise<DocPagePath[]> {
    const nameFilter = /\.md$/;

    const listMarkdownFiles = async (dir: string, prefix: string): Promise<DocPagePath[]> => {
        const names = await readdir(dir);
        const paths = await Promise.all(
            names.map(async (name): Promise<DocPagePath[]> => {
                const path = join(dir, name);
                const stat = await lstat(path);
                if (stat.isDirectory()) {
                    return await listMarkdownFiles(path, `${prefix + name}/`);
                } else if (stat.isFile() && nameFilter.test(name)) {
                    return [(prefix + name) as DocPagePath];
                } else {
                    return [];
                }
            })
        );
        return paths.flat();
    };

    const result = await listMarkdownFiles(DOCS_DIR, '');
    result.sort();
    return result;
}

export async function getAllDocs(): Promise<Map<DocPagePath, Doc>> {
    const paths = await getAllDocPaths();
    const entries = await Promise.all(paths.map(async (p) => [p, await readDocFile(p)] as const));
    return new Map(entries);
}

export function parseDocFile(content: string): Doc {
    const regex = /(^# .+)|(^## .+)|^```[\s\S]*?^```/gm;

    const doc: Doc = {
        title: 'No title',
        subheadings: [],
        markdown: content,
    };

    for (let m; (m = regex.exec(content)); ) {
        const [, h1, h2] = m;
        if (h1) {
            doc.title = h1.slice(1).trim();
        }
        if (h2) {
            doc.subheadings.push(h2.slice(2).trim());
        }
    }

    return doc;
}

export async function readDocFile(path: DocPagePath): Promise<Doc> {
    const content = await readFile(join(DOCS_DIR, path), 'utf-8');
    return parseDocFile(content);
}

export async function getManifest(): Promise<Manifest> {
    const content = await readFile(join(DOCS_DIR, 'manifest.json'), 'utf-8');
    const manifest = JSON.parse(content) as Manifest;
    return manifest;
}

export interface DocMetadata {
    /** UTC timestamp in milliseconds. */
    lastModified: number;
}

export async function getDocFileMetadata(path: DocPagePath): Promise<DocMetadata> {
    const git = simpleGit();

    const file = join(DOCS_DIR, path).replace(/\\/g, '/');

    const log = await git.log({ file, maxCount: 1 }).catch(() => undefined);
    const lastModified = Date.parse(log?.latest?.date ?? '') || Date.now();

    const status = await git.status({}).catch(() => undefined);
    const dirty =
        status &&
        (status.modified.includes(file) ||
            status.staged.includes(file) ||
            status.created.includes(file) ||
            status.not_added.includes(file));

    let mtime = undefined;
    if (dirty) {
        try {
            const stat = await lstat(file);
            mtime = stat.mtime.valueOf();
        } catch {}
    }

    return { lastModified: mtime || lastModified };
}
