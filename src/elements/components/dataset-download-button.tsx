import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { BsChevronDown, BsFillTrashFill } from 'react-icons/bs';
import { FiExternalLink } from 'react-icons/fi';
import { SiDropbox, SiGithub, SiGoogledrive, SiMega, SiMicrosoftonedrive } from 'react-icons/si';
import Logo from '../../../public/logo.svg';
import { isSelfHosted, toDirectDownloadLink } from '../../lib/download-util';
import { joinClasses } from '../../lib/util';
import { Link } from './link';

type DatasetDownloadButtonProps = {
    url: string;
    readonly?: boolean;
    onChange?: (url: string) => void;
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
        if (parsedUrl.hostname === 'cdn.discordapp.com') {
            return 'Discord';
        }
        if (domainAndTld === '1drv.ms') {
            return 'OneDrive';
        }
        if (domainAndTld === 'mega.nz') {
            return 'Mega';
        }
        if (domainAndTld === 'mediafire.com') {
            return 'MediaFire';
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

const isMirrorExternal = (url: string) => !isSelfHosted(url);

export const DatasetDownloadButton = ({ url, readonly, onChange }: DatasetDownloadButtonProps) => {
    const isExternal = isMirrorExternal(url);
    const host = hostFromUrl(url);

    const showMenu = !readonly;

    return (
        <div className="flex w-full flex-row gap-0.5 rounded-xl bg-accent-500 dark:bg-accent-400">
            <Link
                external
                className={joinClasses(
                    'inline-flex h-20 w-full cursor-pointer items-center rounded-l-lg border-0 bg-accent-600 text-center text-lg font-medium text-white transition duration-100 ease-in-out hover:bg-accent-500 dark:bg-accent-500 dark:hover:bg-accent-600',
                    !showMenu && 'rounded-r-lg'
                )}
                href={toDirectDownloadLink(url)}
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
                    Visit Dataset Link
                    {isExternal && (
                        <div className="text-center text-sm font-normal">
                            <span className="whitespace-nowrap px-1">Hosted by {host}</span>
                        </div>
                    )}
                </div>
            </Link>

            {showMenu && (
                <Menu
                    as="div"
                    className="relative inline-block text-left"
                >
                    <div>
                        <Menu.Button
                            aria-label="Edit dataset URL"
                            className="inline-flex h-20 w-12 cursor-pointer items-center rounded-r-lg border-0 bg-accent-600 text-center align-middle text-lg font-medium text-white transition duration-100 ease-in-out hover:bg-accent-500 dark:bg-accent-500 dark:hover:bg-accent-600"
                        >
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
                                {url !== '' && (
                                    <Menu.Item
                                        as="a"
                                        className="flex cursor-pointer rounded-lg p-2 transition-colors duration-100 ease-in-out ui-active:bg-fade-300 ui-active:text-black ui-not-active:text-black dark:ui-active:bg-fade-600 dark:ui-active:text-white dark:ui-not-active:text-white"
                                        onClick={() => {
                                            const newUrl = prompt('Edit URL', url);
                                            if (newUrl !== null && onChange) {
                                                onChange(newUrl);
                                            }
                                        }}
                                    >
                                        {isExternal ? (
                                            <div className="flex h-full w-full flex-row items-center gap-2 align-middle">
                                                <div className="m-0 block h-full align-middle">
                                                    {iconFromHost(host)}
                                                </div>
                                                <div className="m-0 h-full align-middle">{host}</div>
                                            </div>
                                        ) : (
                                            <Logo />
                                        )}
                                        {!readonly && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onChange) {
                                                        onChange('');
                                                    }
                                                }}
                                            >
                                                <BsFillTrashFill />
                                            </button>
                                        )}
                                    </Menu.Item>
                                )}
                                {!readonly && url === '' && (
                                    <Menu.Item
                                        as="a"
                                        className="cursor-pointer rounded-lg p-2 text-center transition-colors duration-100 ease-in-out ui-active:bg-fade-300 ui-active:text-black ui-not-active:text-black dark:ui-active:bg-fade-600 dark:ui-active:text-white dark:ui-not-active:text-white"
                                        onClick={() => {
                                            const newUrl = prompt('Enter a new URL');
                                            if (newUrl && onChange) {
                                                onChange(newUrl);
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
