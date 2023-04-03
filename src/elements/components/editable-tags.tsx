import { Popover, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { BsChevronDown } from 'react-icons/bs';
import { useTags } from '../../lib/hooks/use-tags';
import { TagId } from '../../lib/schema';
import { compareTagId, isDerivedTags } from '../../lib/util';
import style from './editable-tags.module.scss';

export interface EditableTagsProps {
    tags: readonly TagId[];
    onChange?: (value: TagId[]) => void;
    readonly?: boolean;
}
export function EditableTags({ tags, onChange, readonly }: EditableTagsProps) {
    const { tagData } = useTags();

    return (
        <div className={style.tags}>
            {!readonly && onChange && (
                <EditTags
                    tags={tags}
                    onChange={onChange}
                />
            )}
            {tags.map((tagId) => (
                <div
                    className={`${style.tag} bg-gray-200 text-xs text-gray-800 dark:bg-gray-700 dark:text-gray-100`}
                    key={tagId}
                >
                    {tagData.get(tagId)?.name ?? `unknown tag:${tagId}`}
                </div>
            ))}
        </div>
    );
}

function EditTags({ tags, onChange }: { tags: readonly TagId[]; onChange: (value: TagId[]) => void }) {
    const { tagData, categoryOrder } = useTags();

    const [currentTags, setCurrentTags] = useState(tags);
    useEffect(() => {
        setCurrentTags(tags);
    }, [tags]);
    useEffect(() => {
        if (currentTags !== tags && currentTags.join('\n') !== tags.join('\n')) {
            const timerId = setTimeout(() => {
                onChange([...currentTags]);
            }, 1000);
            return () => clearTimeout(timerId);
        }
    }, [currentTags, tags, onChange]);

    const [position, setPosition] = useState<'left' | 'right'>('left');
    const updatePosition = (element: HTMLElement): void => {
        console.log(element);
        const buttonX = element.getBoundingClientRect().x;
        const viewportWidth = document.documentElement.clientWidth;
        setPosition(buttonX + 400 < viewportWidth ? 'left' : 'right');
    };

    return (
        <Popover
            as="div"
            className="relative inline-block text-left"
        >
            <Popover.Button
                className={`${style.editButton} bg-gray-200 text-xs text-gray-800 dark:bg-gray-700 dark:text-gray-100`}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => updatePosition(e.currentTarget)}
                onFocus={(e: React.FocusEvent<HTMLButtonElement>) => updatePosition(e.currentTarget)}
            >
                <BsChevronDown className="w-full" />
            </Popover.Button>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Popover.Panel
                    className={`absolute z-50 mt-2 w-96 origin-top-right divide-y divide-gray-100 rounded-lg bg-fade-100 text-sm shadow-lg focus:outline-none dark:bg-black ${
                        position === 'left' ? 'left-0' : 'right-0'
                    }`}
                >
                    <div className={style.editContainer}>
                        {categoryOrder.map(([categoryId, category]) => {
                            const manual = category.tags.filter((tagId) => !isDerivedTags(tagId));
                            if (manual.length === 0) {
                                return <Fragment key={categoryId} />;
                            }

                            return (
                                <>
                                    <h3>{category.name}</h3>
                                    <div>
                                        {manual.map((tagId) => {
                                            const tag = tagData.get(tagId);
                                            const selected = currentTags.includes(tagId);

                                            return (
                                                <button
                                                    className={`${style.menuItem} text-xs ${
                                                        selected
                                                            ? 'bg-accent-500 text-white dark:bg-accent-600'
                                                            : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                                                    }`}
                                                    data-selected={selected ? '' : undefined}
                                                    key={tagId}
                                                    onClick={() => {
                                                        let newTags;
                                                        if (selected) {
                                                            newTags = currentTags.filter((t) => t !== tagId);
                                                        } else {
                                                            newTags = [...currentTags, tagId].sort(compareTagId);
                                                        }
                                                        setCurrentTags(newTags);
                                                    }}
                                                >
                                                    {tag?.name ?? `unknown tag: ${tagId}`}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            );
                        })}
                    </div>
                </Popover.Panel>
            </Transition>
        </Popover>
    );
}
