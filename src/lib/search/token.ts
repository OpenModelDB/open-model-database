const numberRe = /^\d+$/;

const knownWords = /(jpeg|png|dds|dxt)/;

export function tokenize(query: string): string[] {
    const tokens = query
        .split(/[\s\p{P}\p{Z}_+.]+|(?=\p{Lu}\p{Ll})|([vV](?=\d)|\d+|[A-Z](?:[A-Z](?![a-z]))+)|\b/u)
        .filter(Boolean)
        .map((s) => s.toLowerCase());

    // split known words
    for (let i = 0; i < tokens.length; i++) {
        const a = tokens[i];

        if (knownWords.test(a)) {
            const t = a.split(knownWords).filter(Boolean);
            tokens.splice(i, 1, ...t);
            i += t.length - 1;
        }
    }

    for (let i = 1; i < tokens.length; i++) {
        const a = tokens[i - 1];
        const b = tokens[i];

        // split of trailing v for versions
        if (a.length > 1 && a.endsWith('v') && numberRe.test(b)) {
            tokens.splice(i - 1, 1, a.slice(0, -1), 'v');
            i--;
            continue;
        }

        // merge certain adjacent tokens
        const join = (a === 'v' && numberRe.test(b)) || (numberRe.test(a) && b === 'x');
        if (join) {
            tokens.splice(i - 1, 2, a + b);
        }
    }

    return tokens;
}

const boundaryRe0 = /^|$|\b|(?=[\s\p{P}\p{Z}_+.])|(?=\p{Lu}\p{Ll})/y;
const boundaryRe1 = /[\s\p{P}\p{Z}_+.]|\p{L}\P{L}|\P{L}\p{L}|\d\D|\D\d|[A-Z][A-Z][a-z]/y;
export function isBoundary(text: string, index: number): boolean {
    boundaryRe0.lastIndex = index;
    if (boundaryRe0.test(text)) return true;

    if (index > 0) {
        // step one char back
        index--;

        // surrogate pair
        const c = text.charCodeAt(index);
        if (c >= 0xdc00 && c <= 0xdfff) {
            index--;
        }

        if (boundaryRe1.test(text)) return true;
    }
    return false;
}
