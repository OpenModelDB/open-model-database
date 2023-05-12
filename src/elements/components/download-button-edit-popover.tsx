import { Popover, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { Resource } from '../../lib/schema';

export interface EditResourceProps {
    resource?: Resource;
    onChange: (value: Resource) => void;
}

function ResourceMenu({ resource, onChange }: EditResourceProps) {
    const [size, setSize] = useState(resource?.size ?? 0);
    const [sha256, setSHA256] = useState(resource?.sha256 ?? '');
    const [urls, setURLs] = useState(resource?.urls ?? ['']);
    const [platform, setPlatform] = useState(resource?.platform ?? 'pytorch');

    const platformOptions = [
        { label: 'PyTorch', value: 'pytorch' },
        { label: 'ONNX', value: 'onnx' },
    ];

    return (
        <div className="flex flex-col">
            <div className="flex flex-col">
                <label htmlFor="resource-url">
                    {urls.length > 1 ? 'URLs' : 'URL'} <a className="text-red-500">*</a>
                </label>
                {urls.map((url, index) => (
                    <input
                        required
                        id="resource-url"
                        key={index}
                        type="text"
                        value={url}
                        onChange={(e) => {
                            const newURLs = [...urls];
                            newURLs[index] = e.target.value;
                            setURLs(newURLs);
                        }}
                    />
                ))}
            </div>
            <div className="flex flex-col">
                <label htmlFor="resource-size">
                    Size <a className="text-red-500">*</a>
                </label>
                <input
                    id="resource-size"
                    type="number"
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                />
            </div>
            <div className="flex flex-col">
                <label htmlFor="resource-sha256">
                    sha256 <a className="text-red-500">*</a>
                </label>
                <input
                    id="resource-sha256"
                    type="string"
                    value={sha256}
                    onChange={(e) => setSHA256(e.target.value.toLowerCase())}
                />
            </div>
            <div className="flex flex-col">
                <label htmlFor="resource-platform">
                    Platform <a className="text-red-500">*</a>
                </label>
                <select
                    id="resource-platform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as 'pytorch' | 'onnx')}
                >
                    {platformOptions.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
            <Popover.Button
                className="mt-2 rounded-lg border-0 bg-gray-200 p-2 hover:bg-gray-400 dark:bg-gray-800 dark:hover:bg-gray-600"
                disabled={!urls.length || !sha256 || !size}
                type="submit"
                onClick={() => {
                    if (platform === 'pytorch') {
                        onChange({
                            urls,
                            sha256,
                            size,
                            platform,
                            type: 'pth',
                        });
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    } else if (platform === 'onnx') {
                        onChange({
                            urls,
                            sha256,
                            size,
                            platform,
                            type: 'onnx',
                        });
                    }
                }}
            >
                Save
            </Popover.Button>
        </div>
    );
}

export function EditResourceButton({ resource, onChange, children }: React.PropsWithChildren<EditResourceProps>) {
    const [position, setPosition] = useState<'left' | 'right'>('left');
    const updatePosition = (element: HTMLElement): void => {
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
                className="h-full cursor-pointer"
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
                    <ResourceMenu
                        resource={resource}
                        onChange={onChange}
                    />
                </Popover.Panel>
            </Transition>
        </Popover>
    );
}
