import { default as InternalLink } from 'next/link';
import { BiLinkExternal } from 'react-icons/bi';
import { joinClasses } from '../../lib/util';
import style from './link.module.scss';

export interface LinkProps {
    href: string;
    className?: string;
    external?: boolean;
    type?: string;
    title?: string;
}

export function Link({ external, children, ...props }: React.PropsWithChildren<LinkProps>) {
    if (external) {
        return (
            <a
                rel="noopener noreferrer"
                target="_blank"
                {...props}
            >
                {children}
            </a>
        );
    }

    return <InternalLink {...props}>{children}</InternalLink>;
}

export function TextLink({ external, className, children, ...props }: React.PropsWithChildren<LinkProps>) {
    return (
        <Link
            className={joinClasses(className, style.textLink)}
            external={external}
            {...props}
        >
            {children}
            {external && <BiLinkExternal className={style.externalIcon} />}
        </Link>
    );
}
