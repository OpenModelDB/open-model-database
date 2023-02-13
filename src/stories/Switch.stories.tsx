import { useEffect, useState } from 'react';
import { Switch } from '../elements/components/switch';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Switch> = {
    title: 'Components/Switch',
    component: Switch,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    render: (args) => {
        const [state, setState] = useState(true);
        useEffect(() => setState(args.value), [args.value]);

        return (
            <Switch
                {...args}
                value={state}
                onChange={setState}
            />
        );
    },
};
