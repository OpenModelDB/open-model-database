# Documentation

We use [Markdown](https://www.markdownguide.org/basic-syntax/) files to generate documentation pages.
The Markdown files can be found in our [public repository](https://github.com/OpenModelDB/open-model-database).
Anyone with a GitHub account can improve the documentation of this site.

## Changing existing pages online

> _This section assumes that you already have a GitHub account and that you are logged in._

Changing existing pages online is the easiest way to contribute to the documentation.

1. Go to the page you want to change (e.g. [the FAQ](https://openmodeldb.info/docs/faq)).
2. Scroll to the bottom and click on the "Edit this page on GitHub" button. This will open GitHub, where you can edit the page.
    - If you are not logged in, you will be asked to log in first.
    - GitHub might ask you to fork the project first. This is necessary, so click the "Fork this repository" button.
3. Make your changes.
    - GitHub's online Markdown editor has a preview feature, so you can see how your changes will look like.
    - You can also use the "Show Diff" option to make GitHub highlight the changes you made.
4. Once you are done, click the "Commit changes..." button.
5. GitHub will now ask for a commit message and an extended description.
    - The commit message is a very short description of what you did (e.g. "Fix typo", "Expand on section XYZ", "Add more examples to XYZ"). This is required.
    - The extended description is where you explain your changes in more detail. Explain what you did and why you did it. This is optional but highly recommended, especially if you did more than just fix a typo.
6. Click the "Propose changes" button.
7. Click on the "Create pull request" button.
8. Click on the "Create pull request" button again.

Done! Your changes will be reviewed by the moderators/maintainers of the project shortly. After they have looked over your changes and made sure that everything is in order, they will either approve your changes or request further changes (e.g. we might ask you to fix a typo you made).

## Changing existing pages

> _This section assumes that you have [checked out the project locally](index.md#checking-out-the-project-locally) and know [how to make a pull request](index.md#how-to-make-a-pull-request)._

Editing the contents of existing pages is simple.
Just open the Markdown file of the page you want to change.

The URL of the page will tell you which file you need.
E.g. the Markdown file for `https://openmodeldb.info/docs/interesting/page` is `/docs/interesting/page.md`.
The only exception to this rule are index files.
E.g. `/docs/interesting/index.md` will have the URL `https://openmodeldb.info/docs/interesting`.

While most editors allow you to preview Markdown files (e.g. [VSCode](https://code.visualstudio.com/docs/languages/markdown#_markdown-preview)), you can also see your changes directly on the website.
Just start a [local dev server](index.md#local-dev-server) and navigate to the page you changed.
Note that documentation pages will _not_ update automatically when you make changes to the underlying Markdown file, you have to manually reload the page.

## Adding new pages

> _This section assumes that you have [checked out the project locally](index.md#checking-out-the-project-locally) and know [how to make a pull request](index.md#how-to-make-a-pull-request)._

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
