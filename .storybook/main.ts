import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
    stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],

    // `addon-essentials` and `addon-interactions` are no longer separate
    // packages: from Storybook 9 on, controls, actions, viewport, backgrounds,
    // docs and interactions all live in core, and naming them here fails to
    // resolve.
    addons: ['@storybook/addon-links'],

    framework: {
        name: '@storybook/nextjs',
        options: {},
    },

    // `docs.autodocs` was replaced by the `autodocs` tag on individual stories.
    docs: {},
};

export default config;
