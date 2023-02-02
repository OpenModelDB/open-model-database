/**
 * Paths are guaranteed to before of the form `dir1/dir2/file.md` for n-many directories.
 */
export type DocPagePath = string & { readonly DocPagePath: never };

export interface Doc {
    title: string;
    subheadings: string[];
    markdown: string;
}

export function docPathToSlug(path: DocPagePath): string {
    return path.replace(/\.md$/, '').replace(/(?:^|\/)index$/, '');
}
export function docPathToLink(path: DocPagePath): string {
    return `/docs/${docPathToSlug(path)}`;
}

export function textToLinkId(text: string): string {
    return text
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase();
}
