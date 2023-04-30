/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import { useRouter } from 'next/router';
import React from 'react';
import { FaDiscord, FaGithub } from 'react-icons/fa';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import Logo from '../../public/logo.svg';
import { toggleColorScheme } from '../lib/color-scheme';
import { useEditModeToggle, useWebApi } from '../lib/hooks/use-web-api';
import { ModelId } from '../lib/schema';
import { joinClasses } from '../lib/util';
import { HeaderDrawer } from './components/header-drawer';
import { Link } from './components/link';
import style from './header.module.scss';

export function Header() {
    const { editModeAvailable, editMode, toggleEditMode } = useEditModeToggle();
    const router = useRouter();
    const { webApi } = useWebApi();

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
                    <HeaderDrawer />
                </div>
            </header>
        </>
    );
}
