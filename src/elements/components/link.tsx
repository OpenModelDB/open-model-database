import { default as InternalLink } from 'next/link';
import { BiLinkExternal } from 'react-icons/bi';
import { joinClasses } from 'src/lib/util';
import style from './link.module.scss';

export interface LinkProps {
    href: string;
    className?: string;
    external?: boolean;
}

export function Link({ external, className, href, children }: React.PropsWithChildren<LinkProps>) {
    if (external) {
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

    return (
        <InternalLink
            className={className}
            href={href}
        >
            {children}
        </InternalLink>
    );
}

export function TextLink({ external, className, href, children }: React.PropsWithChildren<LinkProps>) {
    return (
        <Link
            className={joinClasses(className, style.textLink)}
            href={href}
        >
            {children}
            {external && <BiLinkExternal className={style.externalIcon} />}
        </Link>
    );
}
