import { Switch as HeadlessSwitch } from '@headlessui/react';
import style from './switch.module.scss';

export interface SwitchProps {
    value: boolean;
    onChange: (value: boolean) => void;
    srLabel?: string;
}

export function Switch({ value, onChange, srLabel }: SwitchProps) {
    return (
        <HeadlessSwitch
            checked={value}
            className={style.switch}
            onChange={onChange}
        >
            {srLabel && <span className="sr-only">{srLabel}</span>}
            <span
                aria-hidden="true"
                className={style.circle}
            />
        </HeadlessSwitch>
    );
}
