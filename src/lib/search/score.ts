import { isBoundary } from './token';

/**
 * Returns a score for how well the given text matches a certain query, the higher the better.
 *
 * A score of 0 or lower indicates the that given text doesn't match the query at all.
 */
export type ScoreFn = (text: string) => number;

export interface ScoringOptions {
    g1BaseScore: number | ((token: string) => number);
    g1StartAtBoundaryBonus: number;
    g1CombineMatchScores: (scores: number[]) => number;
    g1CombineTokenScores: (scores: number[]) => number;
    g2DistExp: number;
}

export const DEFAULT_OPTIONS: Readonly<ScoringOptions> = {
    g1BaseScore: (token) => token.length ** 0.5,
    g1StartAtBoundaryBonus: 4,
    g1CombineMatchScores: (scores) => scores.reduce((a, b) => a + b, 0),
    g1CombineTokenScores: (scores) => scores.reduce((a, b) => a + b, 0),
    g2DistExp: 1,
};

interface G1Match {
    index: number;
    score: number;
}

export function createScoreFn(queryTokens: string[], options: Readonly<ScoringOptions> = DEFAULT_OPTIONS): ScoreFn {
    if (queryTokens.length === 0) {
        // we don't have a query, so we'll just say that every text matches
        return () => 1;
    }

    return (text) => {
        const g1Matches: G1Match[][] = queryTokens.map((token) => {
            const baseScore =
                typeof options.g1BaseScore === 'number' ? options.g1BaseScore : options.g1BaseScore(token);
            return findMatches(text, token).map((index) => {
                const scoreAddition = isBoundary(text, index) ? options.g1StartAtBoundaryBonus : 0;
                return { index, score: baseScore + scoreAddition };
            });
        });

        const g1Score = options.g1CombineTokenScores(
            g1Matches.map((matches) => options.g1CombineMatchScores(matches.map((m) => m.score)))
        );

        return g1Score;
    };
}

function findMatches(text: string, needle: string): number[] {
    if (needle.length === 0) return [];

    const matches: number[] = [];
    let last = 0;
    let i;
    while ((i = text.indexOf(needle, last)) !== -1) {
        matches.push(i);
        last = i + needle.length;
    }

    return matches;
}
/**
 * Returns all pairs of numbers from `a` and `b` such that the average distance
 * `(a[aIndex] - b[bIndex] + c) ** 2` is minimized.
 *
 * Both `a` and `b` as assumed to be sorted and only contain unique values.
 */
function find2GramPairs(a: readonly number[], b: readonly number[], c: number): [aIndex: number, bIndex: number][] {
    if (a.length === 0 || b.length === 0) return [];
    if (b.length < a.length) {
        // we want a to be the shorter array
        return find2GramPairs(b, a, -c).map(([x, y]) => [y, x]);
    }
    if (a.length === 1) {
        return [[0, binarySearchIndexOfClosest(b, a[0] + c)]];
    }

    return a
        .map((v, i) => {
            const closest = binarySearchIndexOfClosest(b, v + c);
            const bValue = b[closest];
            return { index: i, bIndex: closest, dist: Math.abs(v - bValue + c) };
        })
        .sort((a, b) => a.dist - b.dist)
        .map(({ index, bIndex }) => {
            return [index, bIndex];
        });
}

/**
 * Returns the index if the number in `list` closest to `n`.
 */
function binarySearchIndexOfClosest(list: readonly number[], n: number): number {
    if (list.length === 0) {
        return 0;
    }

    let low = 0;
    let high = list.length;
    while (low < high) {
        const m = (low + high) >> 1;
        const v = list[m];
        if (v === n) {
            return m;
        } else if (v < n) {
            low = m + 1;
        } else {
            high = m;
        }
    }

    // the index low might be off by one in either direct, so we have to check
    const i0 = Math.max(0, Math.min(low - 1, list.length - 1));
    const i1 = Math.max(0, Math.min(low, list.length - 1));
    const i2 = Math.max(0, Math.min(low + 1, list.length - 1));

    const d0 = Math.abs(list[i0] - n);
    const d1 = Math.abs(list[i1] - n);
    const d2 = Math.abs(list[i2] - n);

    if (d0 < d1 && d0 < d2) return i0;
    if (d2 < d1 && d2 < d0) return i2;
    return i1;
}
