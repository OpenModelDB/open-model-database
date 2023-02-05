# Documentation

We use [Markdown](https://www.markdownguide.org/basic-syntax/) files to generate documentation pages.
The Markdown files can be found in our [public repository](https://github.com/OpenModelDB/open-model-database).
Anyone with a GitHub account can improve the documentation of this site.

This page will explain how to make changes to documentation pages.
We assume that you have already cloned our repository onto your local machine.
If you haven't or are new to GitHub, checkout [our guide about GitHub](github.md).

## Changing existing pages

Editing the contents of existing pages is simple.
Just open the Markdown file of the page you want to change.

The URL of the page will tell you which file you need.
E.g. the Markdown file for `https://openmodeldb.info/docs/interesting/page` is `/docs/interesting/page.md`.
The only exception to this rule are index files.
E.g. `/docs/interesting/index.md` will have the URL `https://openmodeldb.info/docs/interesting`.

While most editors allow you to preview Markdown files (e.g. [VSCode](https://code.visualstudio.com/docs/languages/markdown#_markdown-preview)), you can also see your changes directly on the website.
Just start a local dev server and navigate to the page you changed.
Note that documentation pages will *not* update automatically when you make changes to the underlying Markdown file, you have to manually reload the page.

## Adding new pages

To add a new page, we must (1) add a new Markdown file and (2) add the page to the sidebar.

### New Markdown file

For step one, create a new Markdown file in the `/docs` directory. E.g. a new file called `/docs/path/to/page.md` could look like this:
```md
# Title

## Sub heading

Content
```

The name and path of your Markdown file also be its URL on the website.
E.g. the file `/docs/path/to/page.md` will get the URL `https://openmodeldb.info/docs/path/to/page`.

### Sidebar

Open `/docs/manifest.json` in your editor.
This file defines the tree structure of the sidebar.
Its main purpose is to define the order of the documentation Markdown files in the sidebar, but you can also specify some additional options.

The main `routes` property defines all files and directories that will be displayed.
Those are the actual files and directories in the `/docs` directory.
E.g. `{ "file": "faq.md" }` is `/docs/faq.md`.
Directories are similar, but they also contain files and directories as sub-items.

To add your new Markdown file, simply add a new `{ "file": "<page name>.md" }` entry to its parent directory.
If you created a new directory for your file, you also need to add an entry for the directory.
