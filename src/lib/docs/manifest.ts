export interface Manifest {
    routes: Route[];
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
