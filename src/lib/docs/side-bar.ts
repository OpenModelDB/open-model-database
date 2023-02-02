import { Doc, DocPagePath, docPathToLink, textToLinkId } from './doc';
import { Manifest, Route } from './manifest';

export interface SideBar {
    items: SideBarItem[];
}

export interface SideBarItem {
    title: string;
    link?: string;
    current?: true;
    items?: SideBarItem[];
}

export function generateSideBar(
    manifest: Manifest,
    docs: ReadonlyMap<DocPagePath, Doc>,
    current: DocPagePath
): SideBar {
    const mapRoutes = (routes: readonly Route[], prefix: string): SideBarItem[] => {
        return routes
            .map<SideBarItem | undefined>((route) => {
                if ('file' in route) {
                    if (!/^[^./]+\.md$/.test(route.file)) {
                        console.error(`manifest.json: File ${route.file} is not a valid file name`);
                        return undefined;
                    }

                    const path = (prefix + route.file) as DocPagePath;
                    const doc = docs.get(path);
                    if (!doc) {
                        console.error(`manifest.json: File ${path} does not exist`);
                        return undefined;
                    }

                    const link = docPathToLink(path);

                    const items: SideBarItem[] = [];
                    if (route.subHeadings) {
                        for (const heading of doc.subheadings) {
                            items.push({ title: heading, link: `${link}#${textToLinkId(heading)}` });
                        }
                    }

                    const isCurrent = current === path;
                    return {
                        title: doc.title,
                        link,
                        ...(isCurrent ? { current: true } : {}),
                        ...(items.length ? { items } : {}),
                    };
                } else {
                    if (!/^[^./]+\/$/.test(route.directory)) {
                        console.error(
                            `manifest.json: Directory ${route.directory} is not a valid directory name.` +
                                ` (Hint: Directory names must end with "/")`
                        );
                        return undefined;
                    }

                    const indexPath = `${prefix + route.directory}index.md` as DocPagePath;
                    const indexDoc = docs.get(indexPath);
                    const items = mapRoutes(route.routes, prefix + route.directory);

                    if (indexDoc) {
                        console.warn(
                            `manifest.json: The title of directory ${
                                prefix + route.directory
                            } will be ignored because it has an index page.`
                        );

                        const isCurrent = current === indexPath;
                        return {
                            title: indexDoc.title,
                            link: docPathToLink(indexPath),
                            ...(isCurrent ? { current: true } : {}),
                            ...(items.length ? { items } : {}),
                        };
                    } else {
                        return {
                            title: route.title ?? `Missing title: ${prefix}${route.directory}`,
                            ...(items.length ? { items } : {}),
                        };
                    }
                }
            })
            .filter((s): s is SideBarItem => !!s);
    };
    return { items: mapRoutes(manifest.routes, '') };
}
