import { Popover, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { Image, PairedImage, StandaloneImage } from '../../lib/schema';

export interface EditImageProps {
    image?: Image;
    onChange: (value: Image) => void;
}

function PairedImageMenu({ image, onChange }: { image?: PairedImage; onChange: (value: PairedImage) => void }) {
    const [lr, setLR] = useState(image?.LR ?? '');
    const [sr, setSR] = useState(image?.SR ?? '');
    const [thumbnail, setThumbnail] = useState(image?.thumbnail ?? '');

    return (
        <div className="flex flex-col">
            <div className="flex flex-col">
                <label htmlFor="image-lr">
                    LR <a className="text-red-500">*</a>
                </label>
                <input
                    required
                    id="image-lr"
                    type="text"
                    value={lr}
                    onChange={(e) => setLR(e.target.value)}
                />
            </div>
            <div className="flex flex-col">
                <label htmlFor="image-sr">
                    SR <a className="text-red-500">*</a>
                </label>
                <input
                    required
                    id="image-lr"
                    type="text"
                    value={sr}
                    onChange={(e) => setSR(e.target.value)}
                />
            </div>
            <div className="flex flex-col">
                <label htmlFor="image-sr">Thumbnail</label>
                <input
                    id="image-lr"
                    type="text"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                />
            </div>
            <Popover.Button
                className="mt-2 rounded-lg border-0 bg-gray-200 p-2 hover:bg-gray-400 dark:bg-gray-800 dark:hover:bg-gray-600"
                disabled={!lr || !sr}
                type="button"
                onClick={() => {
                    onChange({
                        type: 'paired',
                        LR: lr,
                        SR: sr,
                        thumbnail: thumbnail || undefined,
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
    const [url, setURL] = useState(image?.url ?? '');
    const [thumbnail, setThumbnail] = useState(image?.thumbnail ?? '');

    return (
        <div className="flex flex-col">
            <div className="flex flex-col">
                <label htmlFor="image-url">
                    URL <a className="text-red-500">*</a>
                </label>
                <input
                    required
                    id="image-lr"
                    type="text"
                    value={url}
                    onChange={(e) => setURL(e.target.value)}
                />
            </div>
            <div className="flex flex-col">
                <label htmlFor="image-sr">Thumbnail</label>
                <input
                    id="image-lr"
                    type="text"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                />
            </div>
            <Popover.Button
                className="mt-2 rounded-lg border-0 bg-gray-200 p-2 hover:bg-gray-400 dark:bg-gray-800 dark:hover:bg-gray-600"
                disabled={!url}
                type="button"
                onClick={() => {
                    onChange({
                        type: 'standalone',
                        url: url,
                        thumbnail: thumbnail || undefined,
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
                    className="block"
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
                        className={`absolute z-50 mt-2 w-96 origin-top-right divide-y divide-gray-100 rounded-lg bg-fade-100 p-2 text-sm shadow-lg focus:outline-none dark:bg-black ${
                            position === 'left' ? 'left-0' : 'right-0'
                        }`}
                    >
                        <div className="mb-1 flex gap-2">
                            <button
                                className={`${
                                    mode === 'paired' ? 'bg-gray-400 dark:bg-gray-600' : 'bg-gray-200 dark:bg-gray-800'
                                } rounded-lg border-0 p-2`}
                                onClick={() => setMode('paired')}
                            >
                                Paired
                            </button>
                            <button
                                className={`${
                                    mode === 'standalone'
                                        ? 'bg-gray-400 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-800'
                                        : 'bg-gray-200 hover:bg-gray-400 dark:bg-gray-800 dark:hover:bg-gray-600'
                                } rounded-lg border-0 p-2`}
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
