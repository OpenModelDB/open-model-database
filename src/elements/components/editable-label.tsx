import { useEffect, useState } from 'react';
import { AiFillEdit } from 'react-icons/ai';
import { joinClasses } from '../../lib/util';
import style from './editable-label.module.scss';

export interface EditableLabelProps {
    text: string | number;
    className?: string;
    readonly?: boolean;
    onChange?: (newText: string | number) => void;
    type?: 'text' | 'number';
}

export function EditableLabel({ className, text, onChange, readonly, type = 'text' }: EditableLabelProps) {
    const [edit, setEdit] = useState(false);
    const [value, setValue] = useState(text);

    useEffect(() => setValue(text), [text]);

    if (readonly || !onChange) {
        return <span className={className}>{value}</span>;
    }
    if (!edit) {
        return (
            <span
                className={joinClasses(style.editable, className)}
                onClick={() => setEdit(true)}
            >
                {value}
                <button>
                    <AiFillEdit className={style.icon} />
                </button>
            </span>
        );
    }

    const submit = () => {
        if (value !== text) {
            if (type === 'number') {
                const num = Number(value);
                if (isNaN(num)) {
                    setValue(text);
                    return;
                }
                onChange(num);
            } else {
                onChange(value);
            }
        }
        setEdit(false);
    };

    return (
        <input
            autoFocus
            className={style.input}
            type={type}
            value={value}
            onBlur={submit}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    submit();
                }
            }}
        />
    );
}
