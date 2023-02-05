import { Doc, DocPagePath, docPathToLink, textToLinkId } from './doc';
import { Manifest, Route } from './manifest';

export interface SideBar {
    items: SideBarItem[];
}

export interface SideBarItem {
    title: string;
    link: string;

    fakeLink?: boolean;
    items?: SideBarItem[];
}

export function generateSideBar(manifest: Manifest, docs: ReadonlyMap<DocPagePath, Doc>): SideBar {
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

                    return {
                        title: doc.title,
                        link,
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

                        return {
                            title: indexDoc.title,
                            link: docPathToLink(indexPath),
                            ...(items.length ? { items } : {}),
                        };
                    } else {
                        return {
                            title: route.title ?? `Missing title: ${prefix}${route.directory}`,
                            link: docPathToLink(`${prefix + route.directory.slice(0, -1)}` as DocPagePath),
                            fakeLink: true,
                            ...(items.length ? { items } : {}),
                        };
                    }
                }
            })
            .filter((s): s is SideBarItem => !!s);
    };
    return { items: mapRoutes(manifest.routes, '') };
}

type SideBarItemWithLink = SideBarItem & { fakeLink: false | undefined };

export function getPageList(sideBar: SideBar): SideBarItemWithLink[] {
    const transverse = (item: SideBarItem): SideBarItemWithLink[] => {
        const result: SideBarItemWithLink[] = [];
        if (!item.fakeLink) {
            result.push(item as SideBarItemWithLink);
        }
        if (item.items) {
            result.push(...item.items.flatMap(transverse));
        }
        return result;
    };

    return sideBar.items.flatMap(transverse);
}
