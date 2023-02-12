import { Link } from '../elements/components/link';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Link> = {
    title: 'Components/Link',
    component: Link,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Internal: Story = {
    args: {
        href: 'openmodeldb.info',
        children: 'Open Model DB',
        external: false,
    },
};

export const External: Story = {
    args: {
        ...Internal.args,
        external: true,
    },
};
