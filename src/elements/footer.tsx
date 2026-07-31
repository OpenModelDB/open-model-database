import React from 'react';
import { FaDiscord, FaGithub } from 'react-icons/fa';
import { Link } from './components/link';
import style from './footer.module.scss';

interface FooterLink {
    label: string;
    href: string;
    external?: boolean;
}

const BROWSE: FooterLink[] = [
    { label: 'All models', href: '/' },
    { label: 'Architectures', href: '/architectures' },
    { label: 'Tags', href: '/tags' },
    { label: 'Authors', href: '/users' },
];

const LEARN: FooterLink[] = [
    { label: 'How to upscale', href: '/docs/faq' },
    { label: 'Training', href: '/docs/training' },
    { label: 'Licenses', href: '/docs/licenses' },
];

const CONTRIBUTE: FooterLink[] = [
    { label: 'Contributing guide', href: '/docs/contributing' },
    { label: 'Add a model', href: '/docs/contributing/models' },
    { label: 'Report a bug', href: 'https://github.com/OpenModelDB/open-model-database/issues', external: true },
    {
        label: 'Share feedback',
        href: 'https://github.com/OpenModelDB/open-model-database/discussions/new?category=general',
        external: true,
    },
];

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
    return (
        <div>
            <h2 className={style.columnTitle}>{title}</h2>
            <ul className={style.list}>
                {links.map((link) => (
                    <li key={link.href}>
                        <Link
                            className={style.link}
                            external={link.external}
                            href={link.href}
                        >
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function Footer() {
    return (
        <footer className={style.footer}>
            <div className={style.inner}>
                <div className={style.columns}>
                    <div className={style.about}>
                        <p className={style.blurb}>A community-driven database of AI upscaling models.</p>
                        <div className={style.social}>
                            <Link
                                external
                                aria-label="OpenModelDB on GitHub"
                                className={style.socialLink}
                                href="https://github.com/OpenModelDB/open-model-database"
                            >
                                <FaGithub />
                                <span>GitHub</span>
                            </Link>
                            <Link
                                external
                                aria-label="OpenModelDB on Discord"
                                className={style.socialLink}
                                href="https://discord.gg/cpAUpDK"
                            >
                                <FaDiscord />
                                <span>Discord</span>
                            </Link>
                        </div>
                    </div>

                    <FooterColumn
                        links={BROWSE}
                        title="Browse"
                    />
                    <FooterColumn
                        links={LEARN}
                        title="Learn"
                    />
                    <FooterColumn
                        links={CONTRIBUTE}
                        title="Contribute"
                    />
                </div>

                <div className={style.legal}>
                    <span>Built and maintained by the upscaling community.</span>
                    <span className={style.legalSpacer} />
                    <Link
                        external
                        className={style.legalLink}
                        href="https://github.com/OpenModelDB/open-model-database/blob/main/LICENSE"
                    >
                        Site source under GPL-3.0
                    </Link>
                    <span aria-hidden>·</span>
                    <Link
                        className={style.legalLink}
                        href="/docs/licenses"
                    >
                        Models carry their own licenses
                    </Link>
                </div>
            </div>
        </footer>
    );
}
