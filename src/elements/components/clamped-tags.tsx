import { useEffect, useRef, useState } from 'react';
import { useTags } from '../../lib/hooks/use-tags';
import { TagId } from '../../lib/schema';
import style from './clamped-tags.module.scss';
import { SmallTag } from './editable-tags';

/** px, matching `gap: 0.25rem` on the row. */
const TAG_GAP = 4;

/** How many rows of tags a card shows. Covers 90% of models outright. */
const TAG_ROWS = 2;

/**
 * Width held back for the `+N` chip on the last row.
 *
 * A constant rather than a measurement, deliberately: the chip only exists once
 * we already know tags are hidden, so measuring it would need a second layout
 * pass to settle. 38px covers the widest it gets ("+11" — no model has more
 * than 11 tags), and over-reserving only ever moves one more tag into the
 * count, which stays truthful either way.
 */
const CHIP_RESERVE = 38;

/**
 * How many tags fit, laying them out the way flex-wrap would.
 *
 * `reserveLast` is subtracted from the final row to leave room for the chip.
 */
function simulate(widths: readonly number[], available: number, reserveLast: number): number {
    let row = 0;
    let used = 0;
    let count = 0;

    const limitFor = (r: number) => (r === TAG_ROWS - 1 ? available - reserveLast : available);

    for (const width of widths) {
        const needed = used === 0 ? width : used + TAG_GAP + width;
        if (needed <= limitFor(row)) {
            used = needed;
            count++;
            continue;
        }

        // Doesn't fit on this row: wrap, unless we are already on the last one.
        if (row === TAG_ROWS - 1) break;
        row++;
        // A tag wider than the row itself would loop forever otherwise.
        if (width > limitFor(row)) break;
        used = width;
        count++;
    }

    return count;
}

export interface ClampedTagsProps {
    tags: readonly TagId[];
    className?: string;
}

/**
 * A card's tags, clamped to two rows with a `+N` chip for the remainder.
 *
 * The cut-off is measured rather than a fixed cap, because tag names run from
 * "Anime" to "Compression Removal" — any fixed number is wrong for most cards.
 * Widths are read once, while every tag is still in the DOM, and cached; the
 * fit is then arithmetic, so a resize costs no layout thrash.
 *
 * The server renders every tag, which the row's `overflow: hidden` clips just
 * as it did before. Only the chip appears on hydration, so nothing outside the
 * row moves.
 */
export function ClampedTags({ tags, className }: ClampedTagsProps) {
    const { tagData } = useTags();

    const rowRef = useRef<HTMLDivElement>(null);
    const widths = useRef<number[]>([]);
    const [shown, setShown] = useState(tags.length);

    useEffect(() => {
        const row = rowRef.current;
        if (!row) return;

        widths.current = [];

        const measure = () => {
            const available = row.clientWidth;
            // Zero while the card is in a hidden tab or mid-navigation. Bail;
            // the observer fires again once it has real geometry.
            if (!available) return;

            if (widths.current.length !== tags.length) {
                const children = [...row.children] as HTMLElement[];
                // Only readable on a pass where nothing is hidden yet.
                if (children.length < tags.length) return;
                widths.current = children.slice(0, tags.length).map((child) => child.offsetWidth);
            }

            const fits = simulate(widths.current, available, 0);
            setShown(fits === tags.length ? fits : simulate(widths.current, available, CHIP_RESERVE + TAG_GAP));
        };

        measure();

        const observer = new ResizeObserver(measure);
        observer.observe(row);
        return () => observer.disconnect();
    }, [tags]);

    const hidden = tags.length - shown;

    return (
        <div
            className={className}
            ref={rowRef}
        >
            {tags.slice(0, shown).map((tagId) => (
                <SmallTag
                    key={tagId}
                    name={tagData.get(tagId)?.name ?? `unknown tag:${tagId}`}
                    tagId={tagId}
                />
            ))}
            {hidden > 0 && (
                <span
                    className={style.more}
                    title={tags
                        .slice(shown)
                        .map((tagId) => tagData.get(tagId)?.name ?? tagId)
                        .join(', ')}
                >
                    +{hidden}
                </span>
            )}
        </div>
    );
}
