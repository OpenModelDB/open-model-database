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
        title: 'Default',
        description: 'An example card.',
        tags: ['example', 'card'],
        image: 'https://picsum.photos/240/120',
    },
};

export const LargeImageSrc: Story = {
    args: {
        title: 'The Image Scales (automatically)',
        description: 'Keeps the image size consistent for layout reasons.',
        tags: ['example', 'card'],
        image: 'https://picsum.photos/540/480',
    },
};

export const NoImage: Story = {
    args: {
        title: 'No Image',
        description: 'This is what a card would look like with no image preview.',
        tags: ['no', 'image'],
    },
};

export const LargeImageSize: Story = {
    args: {
        title: 'The Image Can Be Larger',
        description: 'Larger card, I guess.',
        tags: ['example', 'card'],
        image: 'https://picsum.photos/720/960',
        imgSize: 'lg',
    },
};
