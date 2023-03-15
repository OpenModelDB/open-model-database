import { MdDelete } from 'react-icons/md';
import { useWebApi } from '../lib/hooks/use-web-api';
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
}
export function TagView({ tag, usage, onRename, onDelete, onDescriptionChange }: TagViewProps) {
    const { editMode } = useWebApi();

    return (
        <div className={style.tagView}>
            <div>
                <EditableLabel
                    readonly={!editMode}
                    text={tag.name}
                    onChange={onRename}
                />
                {onDelete && (
                    <button
                        className={style.delete}
                        onClick={onDelete}
                    >
                        <MdDelete />
                    </button>
                )}
                {usage !== undefined && <span className="opacity-50"> ({usage})</span>}
            </div>
            <div>
                <EditableMarkdownContainer
                    markdown={tag.description}
                    onChange={onDescriptionChange}
                />
            </div>
        </div>
    );
}
