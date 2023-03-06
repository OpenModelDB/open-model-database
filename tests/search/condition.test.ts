import { Condition, compileCondition } from '../../src/lib/search/logical-condition';

const { variable, and, or, not, stringify } = Condition;

describe('compileCondition', () => {
    const [a, b, c, d] = [...'abcd'].map(variable);
    const conditions: Condition<string>[] = [
        a,
        not(a),
        not(not(not(not(a)))),
        and(),
        and(a),
        and(a, a),
        and(a, b, c, a, b, c),
        or(),
        or(a),
        or(a, a),
        or(a, b, c, a, b, c),
        and(a, or(b), and(d), or(and(a))),
        and(a, not(a)),
        or(a, not(a)),

        or(a, not(b), false),
        or(a, not(b), true),
        and(a, not(b), false),
        and(a, not(b), true),
    ];

    for (const c of conditions) {
        test(stringify(c), () => {
            expect(compileCondition(c)).toMatchSnapshot();
        });
    }
});
