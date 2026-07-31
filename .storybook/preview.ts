import type { Decorator, Preview } from '@storybook/react';
import '../src/styles/globals.scss';

// A single default export, rather than the loose `parameters`/`globalTypes`/
// `decorators` exports the old config used. `@storybook/types` no longer
// exists as a package — those types come from the renderer now.
const preview: Preview = {
    parameters: {
        backgrounds: {
            default: 'light',
        },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
    },

    globalTypes: {
        theme: {
            name: 'Theme',
            description: 'Global theme for components',
            toolbar: {
                icon: 'circlehollow',
                items: ['light', 'dark'],
                showName: true,
                dynamicTitle: true,
            },
        },
    },

    initialGlobals: {
        theme: 'light',
    },
};

// The site reads its palette off `data-theme` on <html>, so the toolbar toggle
// has to write there rather than wrap the story in a provider.
const withTheme: Decorator = (Story, context) => {
    if (typeof document !== 'undefined') {
        document.documentElement.dataset['theme'] = context.globals.theme as string;
    }

    return Story();
};

export const decorators = [withTheme];

export default preview;
