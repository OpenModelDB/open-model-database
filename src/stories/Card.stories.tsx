import { Card } from '../elements/components/card';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Card> = {
    title: 'Components/Card',
    component: Card,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        title: 'Example',
        description: 'An example card',
        tags: ['example', 'card'],
        image: 'https://picsum.photos/240/120',
    },
};

export const LargeImage: Story = {
    args: {
        title: 'Example',
        description: 'An example card',
        tags: ['example', 'card'],
        image: 'https://picsum.photos/540/480',
    },
};
