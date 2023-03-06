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
}

export const DEFAULT_OPTIONS: Readonly<ScoringOptions> = {
    g1BaseScore: (token) => token.length ** 0.5,
    g1StartAtBoundaryBonus: 4,
    g1CombineMatchScores: (scores) => scores.reduce((a, b) => a + b, 0),
    g1CombineTokenScores: (scores) => scores.reduce((a, b) => a + b, 0) * scores.filter((s) => s > 0).length,
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
