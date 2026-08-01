import { describe, expect, it } from 'vitest';
import { CHIP_RESERVE, TAG_GAP, TAG_ROWS, fitCount } from '../../src/lib/tag-fit';

/** Width a row needs to hold exactly these tags on one line. */
const rowWidth = (...widths: number[]) => widths.reduce((sum, w) => sum + w, 0) + TAG_GAP * (widths.length - 1);

describe('fitCount', () => {
    it('shows everything when it all fits on one row', () => {
        expect(fitCount([50, 50], 200)).toBe(2);
    });

    it('shows everything when it exactly fills the available width', () => {
        expect(fitCount([50, 60], rowWidth(50, 60))).toBe(2);
    });

    it('counts the gap between tags, not just their widths', () => {
        // Four tags in a row exactly wide enough for two of them: two per row,
        // all four shown.
        expect(fitCount([50, 50, 50, 50], rowWidth(50, 50))).toBe(4);

        // One pixel narrower and the pair no longer fits with its gap, so each
        // row holds one tag and half the set is hidden. If the gap were not
        // counted, this would still be 4.
        expect(fitCount([50, 50, 50, 50], rowWidth(50, 50) - 1)).toBe(2);
    });

    it('wraps a tag that does not fit rather than dropping it', () => {
        // There is a second row, so falling off the first is not fatal.
        expect(fitCount([50, 60], rowWidth(50, 60) - 1)).toBe(2);
    });

    it('wraps onto the second row rather than dropping a tag', () => {
        // 100 fits, 100 does not — but there is a second row for it.
        expect(fitCount([100, 100], 150)).toBe(2);
    });

    it('fills both rows before it starts hiding anything', () => {
        expect(fitCount([100, 100, 100, 100], 210)).toBe(4);
    });

    it('reserves room for the chip once anything overflows', () => {
        // Five 100px tags in a 210px row: two per row, so four fit and one is
        // hidden. The chip has to share the last row, and 100 + gap + 100 plus
        // the reserve does not fit, so the fourth tag makes way for it.
        const shown = fitCount([100, 100, 100, 100, 100], 210);

        expect(shown).toBe(3);
        expect(shown).toBeLessThan(5);
    });

    it('never reserves chip space when nothing is hidden', () => {
        // The exact-fit case must not lose a tag to a chip that will not exist.
        const widths = [100, 100, 100, 100];
        const available = rowWidth(100, 100);

        expect(fitCount(widths, available)).toBe(4);
    });

    it('returns 0 for no tags', () => {
        expect(fitCount([], 200)).toBe(0);
    });

    it('gives up on a tag wider than the row instead of looping forever', () => {
        // A single unbreakable tag that cannot fit anywhere. The guard against
        // this is the difference between a count and a hung render.
        expect(fitCount([500], 100)).toBe(0);
        expect(fitCount([50, 500, 50], 100)).toBe(1);
    });

    it('handles a zero-width row without hiding behind a negative limit', () => {
        expect(fitCount([50, 50], 0)).toBe(0);
    });

    it('hides everything but never reports a negative remainder', () => {
        const widths = Array.from({ length: 11 }, () => 100);
        const shown = fitCount(widths, 210);

        expect(shown).toBeGreaterThanOrEqual(0);
        expect(shown).toBeLessThanOrEqual(widths.length);
        expect(widths.length - shown).toBeGreaterThan(0);
    });

    it('keeps the row count and reserve as the component expects them', () => {
        // These are shared with the CSS cap in model-card.module.scss. If the
        // row count changes here and not there, tags get clipped again.
        expect(TAG_ROWS).toBe(2);
        expect(CHIP_RESERVE).toBeGreaterThan(0);
        expect(TAG_GAP).toBe(4);
    });
});
