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
