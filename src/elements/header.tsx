/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { BsQuestionLg } from 'react-icons/bs';
import { FaDiscord, FaGithub } from 'react-icons/fa';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import { RxHamburgerMenu } from 'react-icons/rx';
import Logo from '../../public/logo.svg';
import { toggleColorScheme } from '../lib/color-scheme';
import { useEditModeToggle } from '../lib/hooks/use-web-api';
import { joinClasses } from '../lib/util';
import { SearchIcon } from './components/custom-icons';
import { Link } from './components/link';
import { SearchBar } from './components/searchbar';
import style from './header.module.scss';

interface HeaderProps {
    searchBar?: boolean;
}
export function Header({ searchBar }: HeaderProps) {
    const { editModeAvailable, editMode, toggleEditMode } = useEditModeToggle();

    const [searchQuery, setSearchQuery] = React.useState('');
    const router = useRouter();

    const onSearch = () => {
        if (searchQuery !== '') {
            setSearchQuery('');
            router.push(`/?q=${encodeURIComponent(searchQuery)}`).catch((e) => console.error(e));
        }
    };

    return (
        <>
            <div className={style.headerSpacer} />
            <header className={style.header}>
                <div>
                    <Link
                        aria-label="Open Model Database"
                        className={style.logo}
                        href="/"
                    >
                        <div className={style.logoContainer}>
                            <Logo />
                        </div>
                    </Link>

                    <Link
                        className={joinClasses(
                            style.docLink,
                            'ml-8 font-medium tracking-wide text-accent hover:bg-fade-100 dark:text-accent-400 dark:hover:bg-fade-800',
                            style.hideMobile
                        )}
                        href="/docs/faq"
                    >
                        How To Upscale
                    </Link>
                    {editMode && (
                        <Link
                            className={joinClasses(
                                style.docLink,
                                'font-medium tracking-wide text-accent hover:bg-fade-100 dark:text-accent-400 dark:hover:bg-fade-800',
                                style.hideMobile
                            )}
                            href="/add-model"
                        >
                            Add Model
                        </Link>
                    )}

                    <span className={style.spacer} />

                    {editModeAvailable && (
                        <button
                            className={joinClasses(
                                style.docLink,
                                'bg-transparent font-medium tracking-wide text-accent hover:bg-fade-100 dark:text-accent-400 dark:hover:bg-fade-800',
                                style.hideMobile
                            )}
                            onClick={toggleEditMode}
                        >
                            Edit Mode: {editMode ? 'On' : 'Off'}
                        </button>
                    )}

                    {searchBar && (
                        <>
                            <SearchBar
                                className={`${style.search} mx-4 hidden lg:flex`}
                                placeholder="Search models"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onEnter={onSearch}
                            />
                            <Link
                                aria-label="Search models"
                                className={joinClasses(style.iconLink, 'lg:hidden')}
                                href="/"
                            >
                                <SearchIcon
                                    height="1em"
                                    width="1em"
                                />
                            </Link>
                        </>
                    )}

                    <Link
                        external
                        aria-label="GitHub"
                        className={joinClasses(style.iconLink, style.hideMobile)}
                        href="https://github.com/OpenModelDB/open-model-database"
                    >
                        <FaGithub />
                    </Link>
                    <Link
                        external
                        aria-label="Discord"
                        className={joinClasses(style.iconLink, style.hideMobile)}
                        href="https://discord.gg/enhance-everything-547949405949657098"
                    >
                        <FaDiscord />
                    </Link>
                    <button
                        aria-label="Toggle color scheme"
                        className={joinClasses(style.themeButton, style.hideMobile)}
                        type="button"
                        onClick={toggleColorScheme}
                    >
                        <MdLightMode className={style.light} />
                        <MdDarkMode className={style.dark} />
                    </button>

                    <HeaderDrawer />
                </div>
            </header>
        </>
    );
}

function HeaderDrawer() {
    const [showDrawer, setShowDrawer] = useState(false);

    return (
        <>
            <button
                aria-controls="menu-drawer"
                aria-label="Open menu"
                className={joinClasses(style.iconLink, style.showMobile)}
                type="button"
                onClick={() => setShowDrawer(true)}
            >
                <RxHamburgerMenu />
            </button>

            {/* cover the bg with dark */}
            <div
                className={joinClasses(
                    'fixed top-0 left-0 z-30 h-screen w-screen bg-fade-900 opacity-50',
                    style.showMobile,
                    !showDrawer && 'hidden'
                )}
                onClick={() => setShowDrawer(false)}
            />

            <div
                className={joinClasses(
                    'fixed top-0 left-0 z-40 h-screen -translate-x-full overflow-y-auto bg-fade-200 p-4 shadow-xl transition-transform dark:bg-fade-900',
                    style.showMobile,
                    !showDrawer && 'hidden'
                )}
                id="menu-drawer"
                tabIndex={-1}
            >
                {showDrawer && (
                    <>
                        <button
                            aria-controls="menu-drawer"
                            aria-label="Close menu"
                            className="absolute top-2.5 right-2.5 inline-flex cursor-pointer items-center rounded-lg border-0 bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                            type="button"
                            onClick={() => setShowDrawer(false)}
                        >
                            <svg
                                aria-hidden="true"
                                className="h-5 w-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    clipRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    fillRule="evenodd"
                                ></path>
                            </svg>
                            <span className="sr-only">Close menu</span>
                        </button>

                        <div className="flex w-64 flex-col gap-4">
                            Help
                            <Link
                                className="rounded-lg bg-fade-300 py-2 px-3 text-lg font-bold dark:bg-fade-800"
                                href="/docs/faq"
                            >
                                <div className="relative flex items-center gap-2 align-middle">
                                    <BsQuestionLg />
                                    How To Upscale
                                </div>
                            </Link>
                            Links
                            <Link
                                external
                                aria-label="GitHub"
                                className="rounded-lg bg-fade-300 py-2 px-3 text-lg font-bold dark:bg-fade-800"
                                href="https://github.com/OpenModelDB/open-model-database"
                            >
                                <div className="relative flex items-center gap-2 align-middle">
                                    <FaGithub />
                                    GitHub
                                </div>
                            </Link>
                            <Link
                                external
                                aria-label="Discord"
                                className="rounded-lg bg-fade-300 py-2 px-3 text-lg font-bold dark:bg-fade-800"
                                href="https://discord.gg/enhance-everything-547949405949657098"
                            >
                                <div className="relative flex items-center gap-2 align-middle">
                                    <FaDiscord />
                                    Discord
                                </div>
                            </Link>
                            Settings
                            <button
                                aria-label="Toggle color scheme"
                                className={joinClasses(
                                    style.otherThemeButton,
                                    'cursor-pointer rounded-lg border-0 bg-fade-300 bg-transparent py-2 px-3 text-lg font-bold dark:bg-fade-800'
                                )}
                                onClick={toggleColorScheme}
                            >
                                <div className="relative flex items-center gap-2 align-middle">
                                    <MdLightMode className={style.light} />
                                    <MdDarkMode className={style.dark} />
                                    Toggle Theme
                                </div>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
