import { useEffect, useState } from 'react';
import { AiFillEdit } from 'react-icons/ai';
import { joinClasses } from '../../lib/util';
import style from './editable-label.module.scss';

export interface EditableLabelProps {
    text: string;
    className?: string;
    readonly?: boolean;
    onChange?: (newText: string) => void;
}

export function EditableLabel({ className, text, onChange, readonly }: EditableLabelProps) {
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
            onChange(value);
        }
        setEdit(false);
    };

    return (
        <input
            autoFocus
            className={style.input}
            type="text"
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

export interface EditableIntegerLabelProps {
    value: number;
    min: number;
    max: number;
    className?: string;
    readonly?: boolean;
    onChange?: (value: number) => void;
}

export function EditableIntegerLabel({ className, value, min, max, onChange, readonly }: EditableIntegerLabelProps) {
    const [edit, setEdit] = useState(false);
    const [temp, setTemp] = useState<string>(String(value));

    useEffect(() => setTemp(String(value)), [value]);

    if (readonly || !onChange) {
        return <span className={className}>{temp}</span>;
    }
    if (!edit) {
        return (
            <span
                className={joinClasses(style.editable, className)}
                onClick={() => setEdit(true)}
            >
                {temp}
                <button>
                    <AiFillEdit className={style.icon} />
                </button>
            </span>
        );
    }

    const submit = () => {
        const n = parseInt(temp);
        if (!Number.isNaN(n) && min <= n && n <= max) {
            onChange(n);
        } else {
            setTemp(String(value));
        }
        setEdit(false);
    };

    return (
        <input
            autoFocus
            className={style.input}
            max={max}
            min={min}
            type="number"
            value={temp}
            onBlur={submit}
            onChange={(e) => setTemp(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    submit();
                }
            }}
        />
    );
}
