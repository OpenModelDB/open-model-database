import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClampedTags } from '../../src/elements/components/clamped-tags';
import { TagId } from '../../src/lib/schema';

const tags = ['anime', 'cartoon', 'compression-removal', 'deblur', 'debanding'] as TagId[];

/**
 * jsdom does no layout, so every element reports zero width. These stubs give
 * the component something to measure: a fixed row width and a fixed width per
 * tag, which is enough to drive `fitCount` down a real branch.
 */
function stubLayout({ rowWidth, tagWidth }: { rowWidth: number; tagWidth: number }) {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(rowWidth);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(tagWidth);
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('ClampedTags', () => {
    it('renders every tag when there is no layout to measure', () => {
        // The server-render and no-JS case. Falling back to "show everything"
        // matters: the row's CSS clips the overflow, so the worst case is the
        // old behaviour rather than missing tags.
        render(<ClampedTags tags={tags} />);

        expect(screen.getAllByRole('link')).toHaveLength(tags.length);
        expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
    });

    it('resolves each tag id to its display name', () => {
        render(<ClampedTags tags={['anime', 'compression-removal'] as TagId[]} />);

        expect(screen.getByText('Anime')).toBeInTheDocument();
        expect(screen.getByText('Compression Removal')).toBeInTheDocument();
    });

    it('links each tag to a filtered listing', () => {
        render(<ClampedTags tags={['anime'] as TagId[]} />);

        expect(screen.getByRole('link', { name: 'Anime' })).toHaveAttribute('href', '/?t=anime');
    });

    it('falls back to a visible marker for an unknown tag id', () => {
        render(<ClampedTags tags={['not-a-real-tag'] as TagId[]} />);

        expect(screen.getByText('unknown tag:not-a-real-tag')).toBeInTheDocument();
    });

    it('hides what will not fit and counts it in a chip', () => {
        // 5 tags of 100px in a 210px row: two per row before the chip is
        // accounted for, and the chip then costs one more.
        stubLayout({ rowWidth: 210, tagWidth: 100 });
        render(<ClampedTags tags={tags} />);

        const shown = screen.getAllByRole('link');
        const chip = screen.getByText(/^\+\d+$/);

        expect(chip).toHaveTextContent(`+${tags.length - shown.length}`);
        expect(shown.length).toBeLessThan(tags.length);
    });

    it('names the hidden tags in the chip tooltip', () => {
        stubLayout({ rowWidth: 210, tagWidth: 100 });
        render(<ClampedTags tags={tags} />);

        const chip = screen.getByText(/^\+\d+$/);
        const shownNames = screen.getAllByRole('link').map((link) => link.textContent);

        // Everything the row could not show has to be reachable somehow, or the
        // chip is just telling the reader that something is missing.
        expect(chip).toHaveAttribute('title');
        for (const name of shownNames) {
            expect(chip.getAttribute('title')).not.toContain(name);
        }
    });

    it('renders no chip when everything fits', () => {
        stubLayout({ rowWidth: 2000, tagWidth: 100 });
        render(<ClampedTags tags={tags} />);

        expect(screen.getAllByRole('link')).toHaveLength(tags.length);
        expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
    });

    it('passes its class name through to the row', () => {
        // The card hands it `tagRow`, which carries the two-row cap.
        const { container } = render(
            <ClampedTags
                className="tag-row"
                tags={tags}
            />
        );

        expect(container.firstChild).toHaveClass('tag-row');
    });
});
