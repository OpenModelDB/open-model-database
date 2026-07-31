/**
 * How many of a card's tags fit in the space it has.
 *
 * Split out from the component so it can be tested directly: the DOM half is
 * just reading widths, and jsdom has no layout, so this is the only part a
 * unit test can actually reach.
 */

/** px, matching `gap: 0.25rem` on the card's tag row. */
export const TAG_GAP = 4;

/** How many rows of tags a card shows. Covers 90% of models outright. */
export const TAG_ROWS = 2;

/**
 * Width held back for the `+N` chip on the last row.
 *
 * A constant rather than a measurement, deliberately: the chip only exists once
 * we already know tags are hidden, so measuring it would need a second layout
 * pass to settle. 38px covers the widest it gets ("+11" — no model has more
 * than 11 tags), and over-reserving only ever moves one more tag into the
 * count, which stays truthful either way.
 */
export const CHIP_RESERVE = 38;

/**
 * Lay tags out the way flex-wrap would, and count how many land within
 * `TAG_ROWS`. `reserveLast` is subtracted from the final row to leave room for
 * the chip.
 */
function simulate(widths: readonly number[], available: number, reserveLast: number): number {
    const limitFor = (row: number) => (row === TAG_ROWS - 1 ? available - reserveLast : available);

    let row = 0;
    let used = 0;
    let count = 0;

    for (const width of widths) {
        const needed = used === 0 ? width : used + TAG_GAP + width;
        if (needed <= limitFor(row)) {
            used = needed;
            count++;
            continue;
        }

        // Does not fit on this row. Wrap, unless this is already the last one.
        if (row === TAG_ROWS - 1) break;
        row++;
        // A tag wider than the row it wrapped onto can never fit. Stop rather
        // than wrap forever.
        if (width > limitFor(row)) break;
        used = width;
        count++;
    }

    return count;
}

/**
 * How many tags to render, given each tag's width and the row's width.
 *
 * Returns `widths.length` when they all fit — the caller renders no chip in
 * that case, so no space is reserved for one. Otherwise the count is
 * recomputed with the chip's width held back, since the chip has to share the
 * last row with the tags it is counting.
 */
export function fitCount(widths: readonly number[], available: number): number {
    const all = simulate(widths, available, 0);
    if (all === widths.length) return all;

    return simulate(widths, available, CHIP_RESERVE + TAG_GAP);
}
