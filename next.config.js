const path = require('path');

/**
 * The static export is a separate build from the one used for local
 * development: `output: 'export'` has no server, so the API routes that edit
 * mode talks to cannot exist in it. `next export` used to be a second CLI step
 * that made this distinction for us; Next 14 removed it, so the mode is now
 * chosen by the environment variable the build script sets.
 */
const isExport = process.env.NEXT_OUTPUT_EXPORT === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: isExport ? 'export' : undefined,
    reactStrictMode: true,
    sassOptions: {
        includePaths: [path.join(__dirname, 'styles')],
    },

    // SVGs are imported as React components. Turbopack is the default bundler
    // from Next 16 on, so the rule has to be declared for both bundlers — the
    // webpack half still applies when a build opts out with `--webpack`.
    turbopack: {
        rules: {
            '*.svg': {
                loaders: ['@svgr/webpack'],
                as: '*.js',
            },
        },
    },

    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        });

        return config;
    },
};

module.exports = nextConfig;
