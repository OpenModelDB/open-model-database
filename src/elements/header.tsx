/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { BsQuestionLg } from 'react-icons/bs';
import { FaDiscord, FaGithub } from 'react-icons/fa';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import { RxCaretDown } from 'react-icons/rx';
import Logo from '../../public/logo.svg';
import { toggleColorScheme } from '../lib/color-scheme';
import { useEditModeToggle, useWebApi } from '../lib/hooks/use-web-api';
import { ModelId } from '../lib/schema';
import { joinClasses } from '../lib/util';
import { Link } from './components/link';
import style from './header.module.scss';

export function Header() {
    const { editModeAvailable, editMode, toggleEditMode } = useEditModeToggle();
    const router = useRouter();
    const { webApi } = useWebApi();

    const [showDrawer, setShowDrawer] = useState(false);

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
                        <Logo />
                    </Link>

                    <Link
                        className={joinClasses(
                            style.docLink,
                            'font-medium tracking-wide text-accent hover:bg-fade-100 dark:text-accent-400 dark:hover:bg-fade-800',
                            style.hideMobile
                        )}
                        href="/docs/faq"
                    >
                        How To Upscale
                    </Link>
                    {editMode && webApi && (
                        <button
                            className={joinClasses(
                                style.docLink,
                                'bg-transparent font-medium tracking-wide text-accent hover:bg-fade-100 dark:text-accent-400 dark:hover:bg-fade-800',
                                style.hideMobile
                            )}
                            onClick={() => {
                                (async () => {
                                    const modelId = prompt('Enter model ID');
                                    if (!modelId) {
                                        return;
                                    }
                                    const arches = await webApi.architectures.getAll();
                                    if (!arches.size) {
                                        return;
                                    }
                                    const firstArch = [...arches.entries()][0][0];
                                    webApi.models
                                        .update([
                                            [
                                                modelId as ModelId,
                                                {
                                                    name: modelId,
                                                    author: [],
                                                    license: null,
                                                    tags: [],
                                                    description: '',
                                                    date: new Date().toISOString().split('T')[0],
                                                    architecture: firstArch,
                                                    size: null,
                                                    scale: 4,
                                                    inputChannels: 3,
                                                    outputChannels: 3,
                                                    resources: [],
                                                    images: [],
                                                },
                                            ],
                                        ])
                                        .then(() => {
                                            setTimeout(() => {
                                                router.push(`/models/${modelId}`).catch((error) => {
                                                    console.error(error);
                                                });
                                            }, 1000);
                                        })
                                        .catch((error) => {
                                            console.error(error);
                                        });
                                })().catch((error) => {
                                    console.error(error);
                                });
                            }}
                        >
                            Add Model
                        </button>
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
                        onClick={toggleColorScheme}
                    >
                        <MdLightMode className={style.light} />
                        <MdDarkMode className={style.dark} />
                    </button>
                    <button
                        aria-controls="drawer-example"
                        className={joinClasses(
                            'flex rounded-lg border-0 bg-accent-700 p-2 text-center align-middle text-sm font-medium text-white hover:bg-accent-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-accent-600 dark:hover:bg-accent-700 dark:focus:ring-accent-800',
                            style.showMobile
                        )}
                        data-drawer-show="drawer-example"
                        data-drawer-target="drawer-example"
                        type="button"
                        onClick={() => setShowDrawer(true)}
                    >
                        <RxCaretDown className="m-auto" />
                    </button>
                    {showDrawer && (
                        <div
                            aria-labelledby="drawer-label"
                            className="fixed top-0 left-0 z-40 h-screen w-80 -translate-x-full overflow-y-auto bg-fade-200 p-4 shadow-xl transition-transform dark:bg-fade-900"
                            id="drawer-example"
                            tabIndex={-1}
                        >
                            <button
                                aria-controls="drawer-example"
                                className="absolute top-2.5 right-2.5 inline-flex items-center rounded-lg border-0 bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                                data-drawer-hide="drawer-example"
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
                                        clip-rule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        fill-rule="evenodd"
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
                                        'rounded-lg border-0 bg-fade-300 bg-transparent p-0 py-2 px-3 text-2xl font-bold dark:bg-fade-800'
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
                    )}
                </div>
            </header>
        </>
    );
}
