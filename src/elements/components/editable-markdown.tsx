import { useEffect, useState } from 'react';
import { AiFillEdit } from 'react-icons/ai';
import { MarkdownContainer } from '../markdown';
import style from './editable-markdown.module.scss';

export interface EditableMarkdownProps {
    markdown: string;
    placeholder?: string;
    readonly?: boolean;
    onChange?: (newText: string) => void;
}

export function EditableMarkdownContainer({
    markdown,
    placeholder = '*No description*',
    readonly,
    onChange,
}: EditableMarkdownProps) {
    const [edit, setEdit] = useState(false);
    const [value, setValue] = useState(markdown);

    useEffect(() => setValue(markdown), [markdown]);

    if (readonly || !onChange) {
        return (
            <div className={style.view}>
                <MarkdownContainer markdown={value || placeholder} />
            </div>
        );
    }
    if (!edit) {
        return (
            <div
                className={style.view}
                onDoubleClick={() => setEdit(true)}
            >
                <button onClick={() => setEdit(true)}>
                    <AiFillEdit /> Edit
                </button>
                <MarkdownContainer markdown={value || placeholder} />
            </div>
        );
    }

    const submit = () => {
        const final = value.trim();
        if (final !== markdown) {
            onChange(final);
        }
        setValue(final);
        setEdit(false);
    };

    return (
        <textarea
            autoFocus
            className={style.textarea}
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
