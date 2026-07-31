import { useEffect, useRef, useState } from 'react';
import { useTags } from '../../lib/hooks/use-tags';
import { TagId } from '../../lib/schema';
import { fitCount } from '../../lib/tag-fit';
import style from './clamped-tags.module.scss';
import { SmallTag } from './editable-tags';

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
 * fit is then arithmetic (see `fitCount`), so a resize costs no layout thrash.
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

            setShown(fitCount(widths.current, available));
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
