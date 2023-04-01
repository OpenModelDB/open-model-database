import { Menu, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { BsChevronDown, BsFillTrashFill } from 'react-icons/bs';
import { FiExternalLink } from 'react-icons/fi';
import { SiDropbox, SiGithub, SiGoogledrive, SiMega, SiMicrosoftonedrive } from 'react-icons/si';
import Logo from '../../../public/logo.svg';
import { Resource } from '../../lib/schema';
import { joinClasses } from '../../lib/util';
import { Link } from './link';

type DownloadButtonProps = {
    resource: Resource;
    readonly?: boolean;
    onChange?: (resource: Resource) => void;
};

const hostFromUrl = (url: string): string => {
    try {
        const parsedUrl = new URL(url);
        const domainParts = parsedUrl.hostname.split('.');
        const domainAndTld = domainParts.slice(domainParts.length - 2).join('.');

        if (domainAndTld === 'github.com') {
            return 'GitHub';
        }
        if (parsedUrl.hostname === 'drive.google.com') {
            return 'Google Drive';
        }
        if (domainAndTld === '1drv.ms') {
            return 'OneDrive';
        }
        if (domainAndTld === 'mega.nz') {
            return 'Mega';
        }
        if (domainAndTld === 'pcloud.link') {
            return 'pCloud';
        }
        if (domainAndTld === 'icedrive.net') {
            return 'Icedrive';
        }
        if (domainAndTld === 'dropbox.com') {
            return 'Dropbox';
        }
        return parsedUrl.hostname;
    } catch (e) {
        console.debug(e);
        return 'an unknown hoster';
    }
};

const iconFromHost = (host: string) => {
    switch (host) {
        case 'GitHub':
            return <SiGithub className="block" />;
        case 'Google Drive':
            return <SiGoogledrive className="block" />;
        case 'OneDrive':
            return <SiMicrosoftonedrive className="block" />;
        case 'Mega':
            return <SiMega className="block" />;
        case 'Dropbox':
            return <SiDropbox className="block" />;
        default:
            return <FiExternalLink className="block" />;
    }
};

const isMirrorExternal = (url: string) => {
    return !url.startsWith('https://objectstorage.us-phoenix-1.oraclecloud.com/n/ax6ygfvpvzka/b/open-modeldb-files/');
};

export const DownloadButton = ({ resource, readonly, onChange }: DownloadButtonProps) => {
    const [selectedMirror, setSelectedMirror] = useState(resource.urls[0]);

    const isExternal = isMirrorExternal(selectedMirror);
    const host = hostFromUrl(selectedMirror);

    const showMenu = resource.urls.length !== 1 || !readonly;

    return (
        <div className="mb-1 flex w-full flex-row gap-0.5 rounded-xl bg-accent-500 dark:bg-accent-400">
            <Link
                external
                className={joinClasses(
                    'inline-flex h-16 w-full cursor-pointer items-center rounded-l-lg border-0 bg-accent-600 text-center text-lg font-medium text-white transition duration-100 ease-in-out hover:bg-accent-500 dark:bg-accent-500 dark:hover:bg-accent-600',
                    !showMenu && 'rounded-r-lg'
                )}
                href={selectedMirror}
                type="button"
            >
                <div className="w-full">
                    {isExternal ? (
                        <FiExternalLink
                            className="mr-2 h-4 w-4"
                            viewBox="0 0 22 22"
                        />
                    ) : (
                        <svg
                            className="mr-2 h-4 w-4 fill-current"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
                        </svg>
                    )}
                    Download {resource.size ? `(${(resource.size / 1024 / 1024).toFixed(1)} MB)` : ''}
                    <div className="text-center text-sm font-normal">
                        {isExternal ? `Hosted offsite by ${host}` : 'Hosted by OpenModelDB'}
                    </div>
                </div>
            </Link>

            {showMenu && (
                <Menu
                    as="div"
                    className="relative inline-block text-left"
                >
                    <div>
                        <Menu.Button className="inline-flex h-16 w-12 cursor-pointer items-center rounded-r-lg border-0 bg-accent-600 text-center align-middle text-lg font-medium text-white transition duration-100 ease-in-out hover:bg-accent-500 dark:bg-accent-500 dark:hover:bg-accent-600">
                            <BsChevronDown className="w-full" />
                        </Menu.Button>
                    </div>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-lg bg-fade-100 focus:outline-none dark:bg-fade-700">
                            <div className="flex flex-col divide-y rounded-lg p-2 shadow-lg">
                                {resource.urls.map((url) => {
                                    const externalUrl = isMirrorExternal(url);
                                    const host = externalUrl ? hostFromUrl(url) : 'OpenModelDB';

                                    return (
                                        <Menu.Item
                                            as="a"
                                            className="flex cursor-pointer rounded-lg p-2 transition-colors duration-100 ease-in-out ui-active:bg-fade-300 ui-active:text-black ui-not-active:text-black dark:ui-active:bg-fade-600 dark:ui-active:text-white dark:ui-not-active:text-white"
                                            key={url}
                                            onClick={() => setSelectedMirror(url)}
                                        >
                                            {externalUrl ? (
                                                <div className="flex h-full w-full flex-row items-center gap-2 align-middle">
                                                    <div className="m-0 block h-full align-middle">
                                                        {iconFromHost(host)}
                                                    </div>
                                                    <div className="m-0 h-full align-middle">{host}</div>
                                                </div>
                                            ) : (
                                                <Logo className="-mb-2" />
                                            )}
                                            {!readonly && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (onChange) {
                                                            onChange({
                                                                ...resource,
                                                                urls: resource.urls.filter((u) => u !== url),
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <BsFillTrashFill />
                                                </button>
                                            )}
                                        </Menu.Item>
                                    );
                                })}
                                {!readonly && (
                                    <Menu.Item
                                        as="a"
                                        className="cursor-pointer rounded-lg p-2 text-center transition-colors duration-100 ease-in-out ui-active:bg-fade-300 ui-active:text-black ui-not-active:text-black dark:ui-active:bg-fade-600 dark:ui-active:text-white dark:ui-not-active:text-white"
                                        onClick={() => {
                                            const newUrl = prompt('Enter a new URL');
                                            if (newUrl && onChange) {
                                                onChange({
                                                    ...resource,
                                                    urls: resource.urls.concat(newUrl),
                                                });
                                            }
                                        }}
                                    >
                                        + Add URL
                                    </Menu.Item>
                                )}
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>
            )}
        </div>
    );
};
