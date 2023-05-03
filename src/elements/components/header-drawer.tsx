import React, { useState } from 'react';
import { BsQuestionLg } from 'react-icons/bs';
import { FaDiscord, FaGithub } from 'react-icons/fa';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import { RxCaretDown } from 'react-icons/rx';
import { toggleColorScheme } from '../../lib/color-scheme';
import { joinClasses } from '../../lib/util';
import style from '../header.module.scss';
import { Link } from './link';

export const HeaderDrawer = () => {
    const [showDrawer, setShowDrawer] = useState(false);
    return (
        <>
            <button
                aria-controls="menu-drawer"
                aria-label="Open menu"
                className={joinClasses(
                    'flex h-full cursor-pointer rounded-lg border-0 bg-accent-700 p-2 text-center align-middle text-sm font-medium text-white hover:bg-accent-800 dark:bg-accent-600 dark:hover:bg-accent-700',
                    style.showMobile
                )}
                type="button"
                onClick={() => setShowDrawer(true)}
            >
                <RxCaretDown className="m-auto" />
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
                    'fixed top-0 left-0 z-40 h-screen w-80 -translate-x-full overflow-y-auto bg-fade-200 p-4 shadow-xl transition-transform dark:bg-fade-900',
                    style.showMobile,
                    !showDrawer && 'hidden'
                )}
                id="menu-drawer"
                tabIndex={-1}
            >
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
                        className="rounded-lg bg-fade-300 py-2 px-3 text-2xl font-bold dark:bg-fade-800"
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
                        className="rounded-lg bg-fade-300 py-2 px-3 text-2xl font-bold dark:bg-fade-800"
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
                        className="rounded-lg bg-fade-300 py-2 px-3 text-2xl font-bold dark:bg-fade-800"
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
                            'cursor-pointer rounded-lg border-0 bg-fade-300 bg-transparent py-2 px-3 text-2xl font-bold dark:bg-fade-800'
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
            </div>
        </>
    );
};
