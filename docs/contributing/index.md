# Contributing

There are many ways to contribute to the project, and we appreciate all of them.
This page will help you get started.

Before we begin: you need a [GitHub account](https://github.com) to contribute ([why?](#why-github)). If you don't have one already, create a new free account. Don't worry, you do **not** need to know git or how to code to contribute.

Here are some common ways in which you can contribute to the project:

-   [**Reporting bugs and suggesting features**](https://github.com/OpenModelDB/open-model-database/issues)

    Help us improve the project by reporting issues you found and suggesting new features. You have an idea what will make the project better? Tell us about it!

-   [**Adding models**](./models.md)

    Add your latest models to the database, or help us add models from others (assuming that their license allows it).

-   [**Documentation**](./documentation.md)

    Help writing and improving the documentation of the project. This mostly includes writing Markdown files.

## Why GitHub?

GitHub is a code-sharing platform, but it also offers many other features that make it a great place to collaborate on projects. We use it to:

-   Host the project's code.
-   Host the project's website.
-   Manage issues and have discussions.
-   Take and review pull requests (contributions).

GitHub's services are what makes this project (as it is now) possible, and the platform does all of it for free.

We do everything on GitHub, so you need an account to contribute.

## Checking out the project locally

> This section assumes that you are at least somewhat familiar with git and GitHub. If you are not, please read [this guide](https://guides.github.com/activities/hello-world/) first.

Having the project setup locally is required for many ways of contributing. E.g. code contributions absolutely require it, but some other contribution methods also need it.

To check out the project, you need to have an internet connection and the following tools installed:

-   git ([Download](https://git-scm.com/downloads))
-   Node.js >=v16 ([Download](https://nodejs.org/en/download/))

Once you have these tools installed, follow these steps:

1. [Fork](https://docs.github.com/en/get-started/quickstart/fork-a-repo#forking-a-repository) the [OpenModelDB repository](https://github.com/OpenModelDB/open-model-database). This will create your very own copy of the project under your account. You can then make changes to your copy.
2. [Clone](https://docs.github.com/en/get-started/quickstart/fork-a-repo#cloning-your-forked-repository) your forked repository onto your computer. This will download the project to your computer.
3. Open a terminal and navigate to the project folder.
4. Run `npm ci` to install the project dependencies.
5. Run `npm run build` to build the project. If this succeeds, everything installed correctly.

You now have the project installed and are ready to contribute. Open the project in your favorite editor and start making changes. We recommend using [Visual Studio Code](https://code.visualstudio.com/).

## Project setup

The website is a pretty standard [React](https://react.dev/) + [Next.js](https://nextjs.org/) project. We use Next.js to generate a static website that we then host on GitHub Pages.

Let's take a look at the project structure. This will help you find your way around the project.

-   `/data` - Contains the database. You rarely need to edit anything in this folder directly. It's easier to use the [local dev server](#local-dev-server) to make changes to the database.
-   `/docs` - Contains the documentation of the project. This is the folder you want to edit when you want to change the documentation.
-   `/src` - Contains the source code of the project. This includes the website, the "backend" server, and everything else needed to run the project.
    -   `/src/elements` - Contains the UI elements of the website.
    -   `/src/lib` - Contains most of the logic that drives everything.
    -   `/src/pages` - Contains the individual pages of the website.
    -   `/src/styles` - Contains some global styles.
-   `/tests` - Contains the tests of the project.
-   `/scripts` - Contains various scripts we use during CI.

### Useful commands

-   `npm run dev` - Starts the [local dev server](#local-dev-server).
-   `npm run build` - Builds the project.
-   `npm run lint` - Runs the linter.
-   `npm run lint:fix` - Runs the linter and fixes any fixable errors.
-   `npm run test` - Runs the tests.
-   `npm run validate-db` - Runs checks on the database to ensure everything is valid.

## How to make a Pull Request

> _This section assumes that you have [checked out the project locally](#checking-out-the-project-locally)._

GitHub has great [documentation](https://docs.github.com/en/get-started/quickstart/contributing-to-projectss) on making pull requests. We will not repeat that here. Instead, we will focus on the specifics of this project.

A few things you should know about making pull requests to this project:

-   Make sure that your changes are in a separate branch. Do not commit into your `main` branch. If you have conflicts, they will be harder to resolve if you commit into your `main` branch.
-   We make use of GitHub actions to run tests and checks on your pull request. We **won't merge** your pull request until all checks pass. But don't worry. If checks fail, and you can't figure out why, feel free to ask for help in the pull request or just wait, a maintainer will help you.

    Checks include tests, linting and validating the DB. You can run these checks locally using the following commands:

    -   `npm run lint`
    -   `npm run test`
    -   `npm run validate-db`

-   We **squash** all commits into a single commit when merging pull requests. This means that you don't need to force push to create a clean commit history. In fact, we recommend that you don't force push, as it makes it harder to review your changes.

## Local dev server

> _This section assumes that you have [checked out the project locally](#checking-out-the-project-locally)._

The local dev server is a useful tool when changing the website and the database. It allows you to see your changes on a local version of the website without having to deploy to https://openmodeldb.info.

To start the local dev server, run the following command:

```bash
npm run dev
```

This will start the local dev server on port 3010. You can then access the website at http://localhost:3010.

The dev server will automatically reload in most cases when you make changes to the website or the database. The only real exception to this are documentation pages. When you change a documentation page, you need to reload the page to see your new changes.
