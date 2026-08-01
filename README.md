# [OpenModelDB](https://openmodeldb.info/)

![image](https://github.com/OpenModelDB/open-model-database/assets/34788790/24f386cf-aad7-442a-8399-649a11fcc0ea)

![GitHub repo file count (file extension)](https://img.shields.io/github/directory-file-count/OpenModelDB/open-model-database/data%2Fmodels?label=Models&color=%236e64ca&link=https%3A%2F%2Fopenmodeldb.info%2F)
![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/OpenModelDB/open-model-database/frontend.yml)
![Static Badge](https://img.shields.io/badge/PRs-welcome-blue)
![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)

OpenModelDB is a community-driven database of AI upscaling models. We provide a centralized place to discover, compare, and download image/video upscaling models with detailed metadata, example images, and architecture information.

## Features

- Browse 600+ AI upscaling models with detailed information
- Compare models side-by-side with example images
- Filter by architecture, scale, tags, and more
- View model metadata including training details and licenses
- Download models from various sources

## Getting Started

### Prerequisites

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) >= 18.17.0

### Installation

```bash
# Clone the repository
git clone https://github.com/OpenModelDB/open-model-database.git
cd open-model-database

# Install dependencies
npm ci

# Start the development server
npm run dev
```

The site will be available at http://localhost:3010.

## Contributing

We welcome contributions! Here are some ways you can help:

- **Add models**: Submit new AI upscaling models to the database
- **Report bugs**: Open an issue if you find a problem
- **Suggest features**: Share ideas for improvements
- **Improve documentation**: Help make the docs better

See our [Contributing Guide](https://openmodeldb.info/docs/contributing) for detailed instructions on how to:
- Add new models via the web interface
- Set up a local development environment
- Submit pull requests

## Tech Stack

- [React](https://react.dev/) - UI framework
- [Next.js](https://nextjs.org/) - Static site generation
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Links

- [Website](https://openmodeldb.info/)
- [FAQ](https://openmodeldb.info/docs/faq)
- [Discord](https://discord.gg/enhance-everything-547949405949657098)
