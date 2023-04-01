import React from 'react';
import { ReactElement, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { HeadingComponent } from 'react-markdown/lib/ast-to-react';
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json';
import jsx from 'react-syntax-highlighter/dist/cjs/languages/prism/jsx';
import markdown from 'react-syntax-highlighter/dist/cjs/languages/prism/markdown';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/cjs/prism-light';
import { atomDark as theme } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';
import { textToLinkId } from '../lib/docs/doc';
import { useCurrentPath } from '../lib/hooks/use-current-path';
import { joinClasses } from '../lib/util';
import { Link, TextLink } from './components/link';
import style from './markdown.module.scss';

SyntaxHighlighter.registerLanguage('html', jsx);
SyntaxHighlighter.registerLanguage('markup', jsx);
SyntaxHighlighter.registerLanguage('xml', jsx);
SyntaxHighlighter.registerLanguage('javascript', jsx);
SyntaxHighlighter.registerLanguage('js', jsx);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('md', markdown);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('json', json);

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
    className?: string;
}
export function MarkdownContainer(props: MarkdownProps) {
    const baseUrl = useCurrentPath();

    return (
        <div className={joinClasses(style.markdown, props.className)}>
            <ReactMarkdown
                skipHtml
                components={{
                    h2: LinkableHeading,
                    h3: LinkableHeading,
                    h4: LinkableHeading,
                    a: ({ href, children }) => {
                        if (!href) {
                            return <>{children}</>;
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
                        return (
                            <TextLink
                                external
                                href={href}
                            >
                                {children}
                            </TextLink>
                        );
                    },
                    code: ({ inline, className, children }) => {
                        const text = getTextContent(children).replace(/\n$/, '');
                        let lang = /language-([\w-]+)/.exec(className || '')?.[1];

                        if (!lang) {
                            // try to detect language
                            if (isValidJson(text)) {
                                lang = 'json';
                            }
                        }

                        if (inline) {
                            return (
                                <span className={style.codeWrapper}>
                                    <SyntaxHighlighter
                                        PreTag={NoProps}
                                        language={lang || 'none'}
                                        style={theme}
                                    >
                                        {text}
                                    </SyntaxHighlighter>
                                </span>
                            );
                        }

                        return (
                            <SyntaxHighlighter
                                PreTag={'div'}
                                language={lang || 'none'}
                                style={theme}
                            >
                                {text}
                            </SyntaxHighlighter>
                        );
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

function isValidJson(text: string): boolean {
    try {
        JSON.parse(text);
        return true;
    } catch {
        return false;
    }
}

function NoProps({ children }: React.PropsWithChildren<unknown>) {
    return <>{children}</>;
}
