/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { FaDiscord, FaGithub } from 'react-icons/fa';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import Logo from '../../public/logo.svg';
import { toggleColorScheme } from '../lib/color-scheme';
import { useEditModeToggle } from '../lib/hooks/use-web-api';
import { joinClasses } from '../lib/util';
import { Link } from './components/link';
import style from './header.module.scss';

export function Header() {
    const { editModeAvailable, editMode, toggleEditMode } = useEditModeToggle();

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
                            'font-medium tracking-wide text-accent hover:bg-fade-100 dark:text-accent-400 dark:hover:bg-fade-800'
                        )}
                        href="/docs/faq"
                    >
                        How To Upscale
                    </Link>

                    <span className={style.spacer} />

                    {editModeAvailable && (
                        <button
                            className={joinClasses(
                                style.docLink,
                                'bg-transparent font-medium tracking-wide text-accent hover:bg-fade-100 dark:text-accent-400 dark:hover:bg-fade-800'
                            )}
                            onClick={toggleEditMode}
                        >
                            Edit Mode: {editMode ? 'On' : 'Off'}
                        </button>
                    )}

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
