/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { FaDiscord, FaGithub } from 'react-icons/fa';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import Logo from '../../public/logo.svg';
import { toggleColorScheme } from '../lib/color-scheme';
import { joinClasses } from '../lib/util';
import { Link } from './components/link';
import style from './header.module.scss';

export function Header() {
    return (
        <>
            <div className={style.headerSpacer} />
            <header className={style.header}>
                <div>
                    <Link
                        className={style.logo}
                        href="/"
                    >
                        <Logo />
                    </Link>

                    <Link
                        className={joinClasses(
                            style.docLink,
                            'transform rounded-lg px-4 py-2 font-medium capitalize tracking-wide text-accent transition-colors duration-300 hover:bg-fade-100 focus:outline-none focus:ring focus:ring-accent-300 focus:ring-opacity-80 dark:text-accent-400 dark:hover:bg-fade-800'
                        )}
                        href="/docs/faq"
                    >
                        How to upscale
                    </Link>

                    <span className={style.spacer}></span>

                    <section className="relative mx-auto w-full max-w-md rounded-md px-5">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg
                                    className="h-5 w-5 text-fade-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                                        stroke="currentColor"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                    ></path>
                                </svg>
                            </span>

                            <input
                                className="w-full rounded-md border bg-white py-3 pl-10 pr-4 text-fade-700 focus:border-accent-400 focus:outline-none focus:ring focus:ring-accent-300 focus:ring-opacity-40 dark:border-fade-600 dark:bg-fade-900 dark:text-fade-300 dark:focus:border-accent-300"
                                placeholder="Search"
                                type="text"
                            />
                        </div>
                    </section>

                    <span className={style.spacer}></span>

                    <Link
                        external
                        className={style.iconLink}
                        href="https://github.com/OpenModelDB/open-model-database"
                    >
                        <FaGithub />
                    </Link>
                    <Link
                        external
                        className={style.iconLink}
                        href="https://discord.gg/enhance-everything-547949405949657098"
                    >
                        <FaDiscord />
                    </Link>
                    <button
                        className={style.themeButton}
                        onClick={toggleColorScheme}
                    >
                        <MdLightMode className={style.light} />
                        <MdDarkMode className={style.dark} />
                    </button>
                </div>
            </header>
        </>
    );
}
