import React from 'react';
import { ReactElement, ReactNode, isValidElement } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
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

/**
 * react-markdown v9 stopped passing a `level` prop to heading components (and
 * dropped the `HeadingComponent` type with it), so the tag is bound per heading
 * here rather than switched on at render time.
 *
 * Built once at module scope: returning a fresh component from the render body
 * would give every heading a new type on each pass and remount it.
 */
function linkableHeading(Tag: 'h2' | 'h3' | 'h4'): Components['h2'] {
    return function LinkableHeading({ children }) {
        const text = getTextContent(children);
        const id = textToLinkId(text);

        return (
            <Tag
                className={style.linkableHeading}
                id={id}
            >
                <Link href={`#${id}`}>{children}</Link>
            </Tag>
        );
    };
}

const LinkableH2 = linkableHeading('h2');
const LinkableH3 = linkableHeading('h3');
const LinkableH4 = linkableHeading('h4');

/** The language a fenced block declares, e.g. ```json -> `language-json`. */
function languageOf(className: string | undefined): string | undefined {
    return /language-([\w-]+)/.exec(className || '')?.[1];
}

export interface MarkdownProps {
    markdown: string;
    className?: string;
    isIndexPage?: boolean;
}
export function MarkdownContainer({ markdown, className, isIndexPage = false }: MarkdownProps) {
    const baseUrl = useCurrentPath();

    return (
        <div className={joinClasses(style.markdown, className)}>
            <ReactMarkdown
                skipHtml
                components={{
                    h2: LinkableH2,
                    h3: LinkableH3,
                    h4: LinkableH4,
                    a: ({ href, children }) => {
                        if (!href) {
                            return <>{children}</>;
                        }

                        const origin = 'https://openmodeldb.info';
                        const url = new URL(href, origin + baseUrl + (isIndexPage ? '/index' : ''));
                        if (url.href === origin) {
                            return <TextLink href="/">{children}</TextLink>;
                        }
                        if (url.href.startsWith(`${origin}/`)) {
                            let relative = url.href.slice(origin.length);
                            if (relative.startsWith('/docs')) {
                                // remove .md endings in doc links
                                relative = relative.replace(/\.md(?=$|#)/, '');
                                // remove index
                                relative = relative.replace(/\/index(?=$|#)/, '');
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
                    /*
                     * v9 removed the `inline` flag that used to tell these two
                     * cases apart. The structural signal replaces it: a fenced
                     * block is a <code> inside a <pre>, inline code is not. So
                     * `pre` renders the block and never renders its <code>
                     * child, which leaves `code` reached only when inline.
                     */
                    pre: ({ children }) => {
                        // `children` is typed ReactNode, so indexing an array of
                        // it yields `any`. Narrow through ReactNode rather than
                        // letting that spread into `isValidElement`.
                        const nodes: ReactNode[] = Array.isArray(children) ? (children as ReactNode[]) : [children];
                        const code = nodes[0];
                        const codeClass = isValidElement<{ className?: string }>(code)
                            ? code.props.className
                            : undefined;

                        const text = getTextContent(children).replace(/\n$/, '');
                        const lang = languageOf(codeClass) ?? (isValidJson(text) ? 'json' : undefined);

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
                    code: ({ className, children }) => {
                        const text = getTextContent(children).replace(/\n$/, '');
                        const lang = languageOf(className) ?? (isValidJson(text) ? 'json' : undefined);

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
                    },
                }}
                remarkPlugins={[remarkGfm]}
            >
                {markdown}
            </ReactMarkdown>
        </div>
    );
}

function getTextContent(node: ReactNode): string {
    if (!node) return '';
    if (typeof node === 'string') return node;
    // `bigint` joined ReactNode in the React 18.3 types. Grouped with the other
    // primitives rather than special-cased: they all stringify the same way,
    // and leaving it out made the `'children' in node` narrowing below fail,
    // since `in` needs an object.
    if (typeof node === 'number' || typeof node === 'boolean' || typeof node === 'bigint') {
        return String(node);
    }

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
