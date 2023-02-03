import Link from 'next/link';
import { ReactElement, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { textToLinkId } from 'src/lib/docs/doc';

export interface MarkdownProps {
    markdown: string;
}
export function MarkdownContainer(props: MarkdownProps) {
    return (
        <ReactMarkdown
            skipHtml
            // eslint-disable-next-line react/no-children-prop
            children={props.markdown}
            components={{
                h2: ({ children }) => {
                    const text = getTextContent(children);
                    const id = textToLinkId(text);

                    return (
                        <h2 id={id}>
                            <Link href={`#${id}`}>{children}</Link>
                        </h2>
                    );
                },
            }}
        />
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
