import { ReactNode } from 'react';
import { joinClasses } from '../../../lib/util';

function isTrue<T>(value: T | null | undefined | false | '' | 0): value is T {
    return Boolean(value);
}

export type MetadataRow = false | null | undefined | readonly [string, ReactNode];

/**
 * Model properties, as a specification list. Labels are quiet micro-type in a
 * fixed left column so the values read as the content; previously the labels
 * sat in a filled, right-aligned header column that outweighed them.
 *
 * Grouped by kind, because a flat list gave nine training fields the same
 * weight as the license.
 */
export function MetadataTable({ title, rows }: { title?: string; rows: MetadataRow[] }) {
    const filteredRows = rows.filter(isTrue);
    if (filteredRows.length === 0) return null;

    return (
        <section>
            {title && (
                <h2 className="mt-0 mb-2 text-xs font-semibold uppercase tracking-wider text-ink-subtle">{title}</h2>
            )}
            <dl className="m-0 overflow-hidden rounded-card border border-solid border-line bg-surface">
                {filteredRows.map((row, i) => {
                    const [label, value] = row;
                    return (
                        <div
                            className={joinClasses(
                                'grid grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 px-4 py-2.5',
                                // Explicit zero widths: Preflight is disabled, so a
                                // lone `border-t border-solid` paints all four sides.
                                i > 0 && 'border-x-0 border-t border-b-0 border-solid border-line'
                            )}
                            key={i}
                        >
                            <dt className="text-xs font-semibold uppercase leading-5 tracking-wide text-ink-subtle">
                                {label}
                            </dt>
                            <dd className="m-0 min-w-0 break-words text-sm leading-5 text-ink">{value}</dd>
                        </div>
                    );
                })}
            </dl>
        </section>
    );
}
