import { BsChevronDoubleDown, BsChevronDoubleUp, BsChevronDown, BsChevronUp } from 'react-icons/bs';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { MarkDownString, Tag, TagId } from '../lib/schema';
import { TagIdPattern } from '../lib/schema-util';
import { EditableLabel } from './components/editable-label';
import { EditableMarkdownContainer } from './components/editable-markdown';
import style from './tag-view.module.scss';

interface TagViewProps {
    tag: Tag;
    tagId: TagId;
    usage?: number;
    onRename?: (name: string) => void;
    onDescriptionChange?: (description: MarkDownString) => void;
    onDelete?: () => void;
    onMove?: (difference: number) => void;
    onSetHidden?: (hidden: boolean) => void;
    readonly?: boolean;
}
export function TagView({
    tag,
    tagId,
    usage,
    readonly,
    onRename,
    onDelete,
    onDescriptionChange,
    onMove,
    onSetHidden,
}: TagViewProps) {
    return (
        <div className={style.tagView}>
            <div>
                <EditableLabel
                    readonly={readonly}
                    text={tag.name}
                    onChange={onRename}
                />
                {!TagIdPattern.test(tagId) && (
                    <span className="mr-2 text-red-500 dark:text-red-400">Invalid Tag ID</span>
                )}
                {onSetHidden && (
                    <button
                        className={style.iconButton}
                        disabled={readonly}
                        style={{ margin: '0 0.5rem' }}
                        title={
                            tag.hidden
                                ? 'Tag is currently hidden in the simple tag selector'
                                : 'Tag is shown in the simple tag selector'
                        }
                        onClick={() => onSetHidden(!tag.hidden)}
                    >
                        {tag.hidden ? <FaEyeSlash /> : <FaEye />}
                    </button>
                )}
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
            <div className="text-neutral-600 dark:text-neutral-400">
                <EditableMarkdownContainer
                    markdown={tag.description}
                    readonly={readonly}
                    onChange={onDescriptionChange}
                />
            </div>
        </div>
    );
}
