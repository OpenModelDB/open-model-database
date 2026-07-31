/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { BsQuestionLg } from 'react-icons/bs';
import { FaDiscord, FaGithub } from 'react-icons/fa';
import { MdAdd, MdDarkMode, MdGridView, MdLightMode, MdStorage } from 'react-icons/md';
import { RxHamburgerMenu } from 'react-icons/rx';
import Logo from '../../public/logo.svg';
import { toggleColorScheme } from '../lib/color-scheme';
import { useEditModeToggle } from '../lib/hooks/use-web-api';
import { joinClasses } from '../lib/util';
import { ClientOnly } from './components/client';
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
                            <ClientOnly>
                                <Logo />
                            </ClientOnly>
                        </div>
                    </Link>

                    {/* Datasets arrived on main while this branch was in
                        flight. Its links keep their destinations but take this
                        branch's chrome: the `<nav>` landmark, the spacing from
                        `style.nav` rather than a repeated `ml-8`, and the
                        semantic tokens instead of hand-paired `accent`/`fade`
                        light-dark pairs. */}
                    <nav className={joinClasses(style.nav, style.hideMobile)}>
                        <Link
                            className={joinClasses(style.docLink, 'text-accent-text hover:bg-surface-hover')}
                            href="/docs/faq"
                        >
                            How To Upscale
                        </Link>
                        <Link
                            className={joinClasses(style.docLink, 'text-accent-text hover:bg-surface-hover')}
                            href="/"
                        >
                            Models
                        </Link>
                        <Link
                            className={joinClasses(style.docLink, 'text-accent-text hover:bg-surface-hover')}
                            href="/datasets"
                        >
                            Datasets
                        </Link>
                        {editMode && (
                            <>
                                <Link
                                    className={joinClasses(style.docLink, 'text-accent-text hover:bg-surface-hover')}
                                    href="/add-model"
                                >
                                    Add Model
                                </Link>
                                <Link
                                    className={joinClasses(style.docLink, 'text-accent-text hover:bg-surface-hover')}
                                    href="/add-dataset"
                                >
                                    Add Dataset
                                </Link>
                            </>
                        )}
                    </nav>

                    <span className={style.spacer} />

                    {editModeAvailable && (
                        <button
                            className={joinClasses(
                                style.docLink,
                                'bg-transparent text-accent-text hover:bg-surface-hover',
                                style.hideMobile
                            )}
                            onClick={toggleEditMode}
                        >
                            Edit Mode: {editMode ? 'On' : 'Off'}
                        </button>
                    )}

                    <ClientOnly>
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
                            href="https://discord.gg/cpAUpDK"
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
                    </ClientOnly>
                </div>
            </header>
        </>
    );
}

const DRAWER_ITEM =
    'flex cursor-pointer items-center gap-2 rounded-control border border-solid border-line bg-surface-sunken py-2 px-3 text-base font-medium';

function DrawerLabel({ children }: React.PropsWithChildren<unknown>) {
    return <div className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">{children}</div>;
}

function HeaderDrawer() {
    const [showDrawer, setShowDrawer] = useState(false);
    const { editMode } = useEditModeToggle();

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
                    'fixed top-0 left-0 z-40 h-screen -translate-x-full overflow-y-auto bg-surface p-4 shadow-pop transition-transform',
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
                            className="absolute top-2.5 right-2.5 inline-flex cursor-pointer items-center rounded-control border-0 bg-transparent p-1.5 text-sm text-ink-muted hover:bg-surface-hover hover:text-ink"
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

                        <div className="mt-10 flex w-64 flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <DrawerLabel>Help</DrawerLabel>
                                <Link
                                    className={DRAWER_ITEM}
                                    href="/docs/faq"
                                >
                                    <BsQuestionLg />
                                    How To Upscale
                                </Link>
                            </div>

                            {/* Browse and Edit come from main's datasets work.
                                Its drawer used bare text as section headings and
                                a repeated `bg-fade-300 dark:bg-fade-800` pill;
                                these use the same DrawerLabel and DRAWER_ITEM as
                                the sections around them. */}
                            <div className="flex flex-col gap-2">
                                <DrawerLabel>Browse</DrawerLabel>
                                <Link
                                    className={DRAWER_ITEM}
                                    href="/"
                                >
                                    <MdGridView />
                                    Models
                                </Link>
                                <Link
                                    className={DRAWER_ITEM}
                                    href="/datasets"
                                >
                                    <MdStorage />
                                    Datasets
                                </Link>
                            </div>

                            {editMode && (
                                <div className="flex flex-col gap-2">
                                    <DrawerLabel>Edit</DrawerLabel>
                                    <Link
                                        className={DRAWER_ITEM}
                                        href="/add-model"
                                    >
                                        <MdAdd />
                                        Add Model
                                    </Link>
                                    <Link
                                        className={DRAWER_ITEM}
                                        href="/add-dataset"
                                    >
                                        <MdAdd />
                                        Add Dataset
                                    </Link>
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <DrawerLabel>Links</DrawerLabel>
                                <Link
                                    external
                                    className={DRAWER_ITEM}
                                    href="https://github.com/OpenModelDB/open-model-database"
                                >
                                    <FaGithub />
                                    GitHub
                                </Link>
                                <Link
                                    external
                                    className={DRAWER_ITEM}
                                    href="https://discord.gg/cpAUpDK"
                                >
                                    <FaDiscord />
                                    Discord
                                </Link>
                            </div>

                            <div className="flex flex-col gap-2">
                                <DrawerLabel>Settings</DrawerLabel>
                                <button
                                    aria-label="Toggle color scheme"
                                    className={joinClasses(style.otherThemeButton, DRAWER_ITEM, 'w-full text-left')}
                                    type="button"
                                    onClick={toggleColorScheme}
                                >
                                    <MdLightMode className={style.light} />
                                    <MdDarkMode className={style.dark} />
                                    Toggle Theme
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
