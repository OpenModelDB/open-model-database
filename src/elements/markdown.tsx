import Link from 'next/link';
import { ReactElement, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { HeadingComponent } from 'react-markdown/lib/ast-to-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';
import { textToLinkId } from 'src/lib/docs/doc';
import { useCurrentPath } from 'src/lib/hooks/use-current-path';
import { ExternalTextLink, TextLink } from './link';
import style from './markdown.module.scss';

const LinkableHeading: HeadingComponent = ({ children, level }) => {
    const text = getTextContent(children);
    const id = textToLinkId(text);
    const link = <Link href={`#${id}`}>{children}</Link>;

    switch (level) {
        case 2:
            return (
                <h2
                    className={style.linkableHeading}
                    id={id}
                >
                    {link}
                </h2>
            );
        case 3:
            return (
                <h3
                    className={style.linkableHeading}
                    id={id}
                >
                    {link}
                </h3>
            );
        case 4:
            return (
                <h4
                    className={style.linkableHeading}
                    id={id}
                >
                    {link}
                </h4>
            );
        default:
            throw new Error(`Unsupported level ${level}`);
    }
};

export interface MarkdownProps {
    markdown: string;
}
export function MarkdownContainer(props: MarkdownProps) {
    const baseUrl = useCurrentPath();

    return (
        <div className={style.markdown}>
            <ReactMarkdown
                skipHtml
                components={{
                    h2: LinkableHeading,
                    h3: LinkableHeading,
                    h4: LinkableHeading,
                    a: ({ href, children }) => {
                        if (!href) {
                            return <Link href="">{children}</Link>;
                        }

                        const origin = 'https://openmodeldb.info';
                        const url = new URL(href, origin + baseUrl);
                        if (url.href === origin) {
                            return <TextLink href="/">{children}</TextLink>;
                        }
                        if (url.href.startsWith(`${origin}/`)) {
                            let relative = url.href.slice(origin.length);
                            if (relative.startsWith('/docs')) {
                                // remove .md endings in doc links
                                relative = relative.replace(/\.md(?=$|#)/, '');
                            }
                            return <TextLink href={relative}>{children}</TextLink>;
                        }
                        return <ExternalTextLink href={href}>{children}</ExternalTextLink>;
                    },
                    code: ({ inline, className, children }) => {
                        if (inline) {
                            return <code className={`${className ?? ''} ${style.code}`}>{children}</code>;
                        }

                        const match = /language-([\w-]+)/.exec(className || '');
                        if (match) {
                            const [, lang] = match;
                            return (
                                <SyntaxHighlighter
                                    PreTag="div"
                                    language={lang}
                                    style={tomorrow}
                                >
                                    {getTextContent(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            );
                        }
                        return <code className={className}>{children}</code>;
                    },
                }}
                remarkPlugins={[remarkGfm]}
            >
                {props.markdown}
            </ReactMarkdown>
        </div>
    );
}

function getTextContent(node: ReactNode): string {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (typeof node === 'number' || typeof node === 'boolean') return String(node);

    if (Array.isArray(node)) return node.map(getTextContent).join('');

    if ('children' in node) return getTextContent(node.children);
    return getTextContent((node as ReactElement<{ children?: ReactNode }>).props.children);
}
