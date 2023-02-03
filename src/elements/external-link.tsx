export interface ExternalLinkProps {
    href: string;
    className?: string;
}

export function ExternalLink({ className, href, children }: React.PropsWithChildren<ExternalLinkProps>) {
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
