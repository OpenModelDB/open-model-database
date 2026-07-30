import { Popover, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { extractImage } from '../../lib/image-util';
import { Image, PairedImage, StandaloneImage } from '../../lib/schema';
import { joinClasses } from '../../lib/util';
import {
    EDIT_BUTTON,
    EDIT_BUTTON_ACTIVE,
    EDIT_BUTTON_PRIMARY,
    EDIT_FIELD,
    EDIT_ICON_BUTTON,
    EDIT_LABEL,
    EDIT_PANEL,
} from './edit-chrome';

export interface EditImageProps {
    image?: Image;
    onChange: (value: Image) => void;
}

function PairedImageMenu({ image, onChange }: { image?: PairedImage; onChange: (value: PairedImage) => void }) {
    const [caption, setCaption] = useState(image?.caption ?? '');
    const [lr, setLR] = useState(image?.LR ?? '');
    const [sr, setSR] = useState(image?.SR ?? '');

    return (
        <div className="flex flex-col">
            <div className={EDIT_FIELD}>
                <label
                    className={EDIT_LABEL}
                    htmlFor="image-caption"
                >
                    Caption
                </label>
                <input
                    id="image-caption"
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                />
            </div>
            <div className={EDIT_FIELD}>
                <label
                    className={EDIT_LABEL}
                    htmlFor="image-lr"
                >
                    LR <span className="text-red-500">*</span>
                </label>
                <input
                    autoFocus
                    required
                    id="image-lr"
                    type="text"
                    value={lr}
                    onChange={(e) => {
                        const url = e.target.value;
                        extractImage(url).then(
                            (value) => {
                                if (value.type === 'paired') {
                                    setLR(value.LR);
                                    setSR(value.SR);
                                } else {
                                    setLR(value.url);
                                }
                            },
                            () => {
                                setLR(url);
                            }
                        );
                    }}
                />
            </div>
            <div className={EDIT_FIELD}>
                <label
                    className={EDIT_LABEL}
                    htmlFor="image-sr"
                >
                    SR <span className="text-red-500">*</span>
                </label>
                <input
                    required
                    id="image-sr"
                    type="text"
                    value={sr}
                    onChange={(e) => {
                        const url = e.target.value;
                        extractImage(url).then(
                            (value) => {
                                if (value.type === 'paired') {
                                    setLR(value.LR);
                                    setSR(value.SR);
                                } else {
                                    setSR(value.url);
                                }
                            },
                            () => {
                                setSR(url);
                            }
                        );
                    }}
                />
            </div>
            <Popover.Button
                className={joinClasses('mt-1', EDIT_BUTTON_PRIMARY)}
                disabled={!lr || !sr}
                type="button"
                onClick={() => {
                    onChange({
                        type: 'paired',
                        LR: lr,
                        SR: sr,
                        caption: caption || undefined,
                    });
                }}
            >
                Save
            </Popover.Button>
        </div>
    );
}

function StandaloneImageMenu({
    image,
    onChange,
}: {
    image?: StandaloneImage;
    onChange: (value: StandaloneImage) => void;
}) {
    const [caption, setCaption] = useState(image?.caption ?? '');
    const [url, setURL] = useState(image?.url ?? '');

    async function parseSingle(url: string): Promise<StandaloneImage> {
        const value = await extractImage(url);
        if (value.type === 'standalone') {
            return value;
        }
        throw new Error('Not a standalone image');
    }

    return (
        <div className="flex flex-col">
            <div className="flex flex-col">
                <div className={EDIT_FIELD}>
                    <label
                        className={EDIT_LABEL}
                        htmlFor="image-caption"
                    >
                        Caption
                    </label>
                    <input
                        id="image-caption"
                        type="text"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                    />
                </div>
                <label
                    className={EDIT_LABEL}
                    htmlFor="image-url"
                >
                    URL <span className="text-red-500">*</span>
                </label>
                <input
                    autoFocus
                    required
                    className="mt-1"
                    id="image-url"
                    type="text"
                    value={url}
                    onChange={(e) => {
                        const url = e.target.value.trim();

                        parseSingle(url).then(
                            (value) => {
                                setURL(value.url);
                            },
                            () => {
                                setURL(url);
                            }
                        );
                    }}
                />
            </div>
            <Popover.Button
                className={joinClasses('mt-1', EDIT_BUTTON_PRIMARY)}
                disabled={!url}
                type="button"
                onClick={() => {
                    onChange({
                        type: 'standalone',
                        url: url,
                        caption: caption || undefined,
                    });
                }}
            >
                Save
            </Popover.Button>
        </div>
    );
}

export function EditImageButton({ image, onChange, children }: React.PropsWithChildren<EditImageProps>) {
    const [position, setPosition] = useState<'left' | 'right'>('left');
    const updatePosition = (element: HTMLElement): void => {
        const buttonX = element.getBoundingClientRect().x;
        const viewportWidth = document.documentElement.clientWidth;
        setPosition(buttonX + 400 < viewportWidth ? 'left' : 'right');
    };

    const [mode, setMode] = useState<'paired' | 'standalone'>(image?.type ?? 'paired');

    return (
        <>
            <Popover
                as="div"
                className="relative inline-block text-left"
            >
                <Popover.Button
                    className={EDIT_ICON_BUTTON}
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => updatePosition(e.currentTarget)}
                    onFocus={(e: React.FocusEvent<HTMLButtonElement>) => updatePosition(e.currentTarget)}
                >
                    {children}
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
                        className={joinClasses(EDIT_PANEL, 'p-3', position === 'left' ? 'left-0' : 'right-0')}
                    >
                        <div className="mb-3 flex gap-2">
                            <button
                                aria-pressed={mode === 'paired'}
                                className={mode === 'paired' ? EDIT_BUTTON_ACTIVE : EDIT_BUTTON}
                                type="button"
                                onClick={() => setMode('paired')}
                            >
                                Paired
                            </button>
                            <button
                                aria-pressed={mode === 'standalone'}
                                className={mode === 'standalone' ? EDIT_BUTTON_ACTIVE : EDIT_BUTTON}
                                type="button"
                                onClick={() => setMode('standalone')}
                            >
                                Standalone
                            </button>
                        </div>
                        {mode === 'paired' ? (
                            <PairedImageMenu
                                image={image as PairedImage}
                                onChange={onChange as (value: PairedImage) => void}
                            />
                        ) : (
                            <StandaloneImageMenu
                                image={image as StandaloneImage}
                                onChange={onChange as (value: StandaloneImage) => void}
                            />
                        )}
                    </Popover.Panel>
                </Transition>
            </Popover>
        </>
    );
}
