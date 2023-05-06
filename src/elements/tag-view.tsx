import { BsChevronDoubleDown, BsChevronDoubleUp, BsChevronDown, BsChevronUp } from 'react-icons/bs';
import { MdDelete } from 'react-icons/md';
import { MarkDownString, Tag } from '../lib/schema';
import { EditableLabel } from './components/editable-label';
import { EditableMarkdownContainer } from './components/editable-markdown';
import style from './tag-view.module.scss';

interface TagViewProps {
    tag: Tag;
    usage?: number;
    onRename?: (name: string) => void;
    onDescriptionChange?: (description: MarkDownString) => void;
    onDelete?: () => void;
    onMove?: (difference: number) => void;
    readonly?: boolean;
}
export function TagView({ tag, usage, readonly, onRename, onDelete, onDescriptionChange, onMove }: TagViewProps) {
    return (
        <div className={style.tagView}>
            <div>
                <EditableLabel
                    readonly={readonly}
                    text={tag.name}
                    onChange={onRename}
                />
                {!readonly && onDelete && (
                    <button
                        className={style.iconButton}
                        title="Delete tag"
                        onClick={onDelete}
                    >
                        <MdDelete />
                    </button>
                )}
                {!readonly && onMove && (
                    <>
                        <button
                            className={style.iconButton}
                            title="Move tag up"
                            onClick={() => onMove(-1)}
                        >
                            <BsChevronUp />
                        </button>
                        <button
                            className={style.iconButton}
                            title="Move tag down"
                            onClick={() => onMove(1)}
                        >
                            <BsChevronDown />
                        </button>
                        <button
                            className={style.iconButton}
                            title="Move tag to top"
                            onClick={() => onMove(-Infinity)}
                        >
                            <BsChevronDoubleUp />
                        </button>
                        <button
                            className={style.iconButton}
                            title="Move tag to bottom"
                            onClick={() => onMove(Infinity)}
                        >
                            <BsChevronDoubleDown />
                        </button>
                    </>
                )}
                {usage !== undefined && <span className="opacity-50"> ({usage})</span>}
            </div>
            <div>
                <EditableMarkdownContainer
                    markdown={tag.description}
                    readonly={readonly}
                    onChange={onDescriptionChange}
                />
            </div>
        </div>
    );
}
