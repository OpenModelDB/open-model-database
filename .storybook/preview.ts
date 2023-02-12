import { Decorator } from '@storybook/react'
import '../src/styles/globals.scss'

export const parameters = {
  backgrounds: {
    default: 'light',
  },
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'light',
    toolbar: {
      icon: 'circlehollow',
      // Array of plain string values or MenuItem shape (see below)
      items: ['light', 'dark'],
      // Property that specifies if the name of the item will be displayed
      showName: true,
      // Change title based on selected value
      dynamicTitle: true,
    },
  },
};

const withThemeProvider: Decorator = (Story, context) => {
  if (typeof document !== undefined) {
    document.documentElement.dataset['theme'] = context.globals.theme;
  }

  return Story();
};
export const decorators = [withThemeProvider];
