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
    g2Score: (aScore: number, bScore: number, distance: number) => number;
    g2CombineMatchScores: (scores: number[]) => number;
    g2CombineTokenScores: (scores: number[]) => number;
}

export const DEFAULT_OPTIONS: Readonly<ScoringOptions> = {
    g1BaseScore: (token) => token.length ** 0.5,
    g1StartAtBoundaryBonus: 4,
    g1CombineMatchScores: (scores) => scores.reduce((a, b) => a + b, 0),
    g1CombineTokenScores: (scores) => scores.reduce((a, b) => a + b, 0) * scores.filter((s) => s > 0).length,
    g2Score: (aScore: number, bScore: number, distance: number) => (aScore + bScore) / (distance + 1) ** 0.5,
    g2CombineMatchScores: (scores) => scores.reduce((a, b) => a + b, 0),
    g2CombineTokenScores: (scores) => scores.reduce((a, b) => a + b, 0) * scores.filter((s) => s > 0).length,
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

        const g2Scores: number[] = [];
        for (let i = 1; i < queryTokens.length; i++) {
            const prevToken = queryTokens[i - 1];
            // const nextToken = queryTokens[i];
            const prevG1 = g1Matches[i - 1];
            const nextG1 = g1Matches[i];

            const g2Pairs = findClosestAfter(
                prevG1.map((m) => m.index + prevToken.length),
                nextG1.map((m) => m.index)
            );
            const matchScores: number[] = [];
            for (const [p, n] of g2Pairs) {
                const pG1 = prevG1[p];
                const nG1 = nextG1[n];
                matchScores.push(options.g2Score(pG1.score, nG1.score, nG1.index - (pG1.index + prevToken.length)));
            }
            g2Scores.push(options.g2CombineMatchScores(matchScores));
        }

        const g1Score = options.g1CombineTokenScores(
            g1Matches.map((matches) => options.g1CombineMatchScores(matches.map((m) => m.score)))
        );
        const g2Score = options.g2CombineTokenScores(g2Scores);

        return g1Score + g2Score;
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

function findClosestAfter(before: number[], after: number[]): [beforeIndex: number, afterIndex: number][] {
    const result: [number, number][] = [];

    let aIndex = 0;
    for (let bIndex = 0; bIndex < before.length; bIndex++) {
        const b = before[bIndex];
        for (; aIndex < after.length; aIndex++) {
            const a = after[aIndex];
            if (a >= b) {
                result.push([bIndex, aIndex]);
                break;
            }
        }
    }

    return result;
}
