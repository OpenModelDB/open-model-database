export interface Manifest {
    routes: Route[];
    /**
     * An optional mapping of redirects.
     *
     * The keys in this map are the slugs of the previously generated page relative to `/docs`.
     * The values are the targets. these come in 2 flavors: absolute targets and relative targets.
     * Relative targets the slug of a doc page relative to `/docs`.
     * Absolute targets are the slugs of any page on the site and they start with `/`.
     *
     * Example:
     * ```js
     * redirects: {
     *   "": "foo", // maps /docs to /docs/foo
     *   "faq": "questions", // maps /docs/faq to /docs/questions
     *   "about": "/about", // maps /docs/about to /about
     *   "getting-started": "", // maps /docs/getting-started to /docs
     * }
     * ```
     */
    redirects?: Record<string, string>;
}

export type Route = FileRoute | DirectoryRoute;

export interface FileRoute {
    /**
     * The name of the markdown file of this route.
     *
     * The name is not allowed to include directories or path traversal.
     */
    file: string;
    /**
     * Whether the `h2` sub headings of the file should be displayed as sub routes in the side bar.
     */
    subHeadings?: true;
}
export interface DirectoryRoute {
    /**
     * The name of the directory of all files of this route.
     *
     * The name is not allowed to include directories or path traversal and must end with a `/`.
     */
    directory: string;
    title?: string;
    routes: Route[];
}
