import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MarkdownContainer } from '../../src/elements/markdown';

// MarkdownContainer resolves relative links against the current route.
vi.mock('next/router', () => ({
    useRouter: () => ({ asPath: '/docs/faq' }),
}));

describe('MarkdownContainer', () => {
    it('renders headings with a self-link anchor', () => {
        render(<MarkdownContainer markdown={'## Getting started\n'} />);

        const heading = screen.getByRole('heading', { level: 2 });

        expect(heading).toHaveAttribute('id', 'getting-started');
        expect(heading.querySelector('a')).toHaveAttribute('href', '#getting-started');
    });

    it('uses the right tag for each heading level', () => {
        render(<MarkdownContainer markdown={'## Two\n\n### Three\n\n#### Four\n'} />);

        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Two');
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Three');
        expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Four');
    });

    // react-markdown v9 removed the `inline` prop these two cases used to be
    // told apart by. The distinction is now structural — a fenced block is a
    // <code> inside a <pre> — so both directions are worth pinning down.
    it('keeps inline code inline', () => {
        const { container } = render(<MarkdownContainer markdown={'Use `npm run dev` to start.\n'} />);

        // Inline code must not be wrapped in a block-level <pre>.
        expect(container.querySelector('pre')).toBeNull();
        expect(container.textContent).toContain('npm run dev');
    });

    it('renders a fenced code block', () => {
        const { container } = render(<MarkdownContainer markdown={'```json\n{"a": 1}\n```\n'} />);

        expect(container.textContent).toContain('"a"');
        expect(container.textContent).toContain('1');
    });

    it('rewrites internal links to relative routes and marks external ones', () => {
        render(
            <MarkdownContainer markdown={'[docs](https://openmodeldb.info/docs/faq) and [out](https://example.com)'} />
        );

        expect(screen.getByRole('link', { name: 'docs' })).toHaveAttribute('href', '/docs/faq');
        expect(screen.getByRole('link', { name: 'out' })).toHaveAttribute('href', 'https://example.com');
    });

    it('renders GitHub-flavoured tables', () => {
        render(<MarkdownContainer markdown={'| a | b |\n| - | - |\n| 1 | 2 |\n'} />);

        expect(screen.getByRole('table')).toBeInTheDocument();
    });
});
