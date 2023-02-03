/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import React from 'react';
import { FaDiscord, FaGithub } from 'react-icons/fa';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import { toggleColorScheme } from 'src/lib/color-scheme';
import { ExternalLink } from './external-link';
import style from './header.module.scss';

export function Header() {
    return (
        <header className={style.header}>
            <div>
                <img src="/logo.png" />

                <Link
                    className={style.docLink}
                    href="/docs/faq"
                >
                    How to upscale
                </Link>

                <span className={style.spacer}></span>

                <ExternalLink
                    className={style.iconLink}
                    href="https://github.com/OpenModelDB/open-model-database"
                >
                    <FaGithub />
                </ExternalLink>
                <ExternalLink
                    className={style.iconLink}
                    href="https://discord.gg/enhance-everything-547949405949657098"
                >
                    <FaDiscord />
                </ExternalLink>
                <button
                    className={style.lightThemeButton}
                    onClick={toggleColorScheme}
                >
                    <MdLightMode />
                </button>
                <button
                    className={style.darkThemeButton}
                    onClick={toggleColorScheme}
                >
                    <MdDarkMode />
                </button>
            </div>
        </header>
    );
}
