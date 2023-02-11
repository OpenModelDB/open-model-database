import Link from 'next/link';
import { BiLinkExternal } from 'react-icons/bi';
import { joinClasses } from '../../src/lib/util';
import style from './link.module.scss';

export interface LinkProps {
    href: string;
    className?: string;
}

export function ExternalLink({ className, href, children }: React.PropsWithChildren<LinkProps>) {
    return (
        <a
            className={className}
            href={href}
            rel="noopener noreferrer"
            target="_blank"
        >
            {children}
        </a>
    );
}

export function ExternalLinkWithIcon({ className, href, children }: React.PropsWithChildren<LinkProps>) {
    return (
        <ExternalLink
            className={className}
            href={href}
        >
            {children}
            <BiLinkExternal />
        </ExternalLink>
    );
}

export function ExternalTextLink({ className, href, children }: React.PropsWithChildren<LinkProps>) {
    return (
        <ExternalLinkWithIcon
            className={joinClasses(className, style.textLink, style.external)}
            href={href}
        >
            {children}
        </ExternalLinkWithIcon>
    );
}

export function TextLink({ className, href, children }: React.PropsWithChildren<LinkProps>) {
    return (
        <Link
            className={joinClasses(className, style.textLink)}
            href={href}
        >
            {children}
        </Link>
    );
}
