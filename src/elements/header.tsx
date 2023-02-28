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
