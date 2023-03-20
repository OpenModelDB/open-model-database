import { assertNever } from '../util';

export type Condition<T> = Condition.Var<T> | Condition.And<T> | Condition.Or<T> | Condition.Not<T> | boolean;
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Condition {
    export type Var<T> = { readonly type: 'var'; value: T };
    export type And<T> = { readonly type: 'and'; items: Condition<T>[] };
    export type Or<T> = { readonly type: 'or'; items: Condition<T>[] };
    export type Not<T> = { readonly type: 'not'; item: Condition<T> };

    export function variable<T>(value: T): Condition.Var<T> {
        return { type: 'var', value };
    }
    export function and<T>(...conditions: Condition<T>[]): Condition.And<T> {
        return { type: 'and', items: conditions };
    }
    export function or<T>(...conditions: Condition<T>[]): Condition.Or<T> {
        return { type: 'or', items: conditions };
    }
    export function not<T>(condition: Condition<T>): Condition.Not<T> {
        return { type: 'not', item: condition };
    }

    export function stringify<T>(
        condition: Condition<T> | CompiledCondition<T>,
        toString: (variable: T) => string = String
    ): string {
        if (typeof condition === 'boolean') {
            return condition ? 'T' : 'F';
        }

        switch (condition.type) {
            case 'const':
                return condition.value ? 'T' : 'F';
            case 'var': {
                const value = toString(condition.value);
                if ('negated' in condition && condition.negated) {
                    return `¬${value}`;
                }
                return value;
            }
            case 'not':
                return `¬${stringify(condition.item, toString)}`;
            case 'and':
                return `∀(${condition.items.map((i) => stringify(i, toString)).join(' ')})`;
            case 'or':
                return `∃(${condition.items.map((i) => stringify(i, toString)).join(' ')})`;
            default:
                return assertNever(condition);
        }
    }
}

export type AtLeastTwo<T> = [T, T, ...T[]];
export type CompiledCondition<T> = CompiledVar<T> | CompiledAnd<T> | CompiledOr<T> | CompiledConst;
export type CompiledVar<T> = { readonly type: 'var'; readonly value: T; negated: boolean };
export type CompiledAnd<T> = { type: 'and'; items: AtLeastTwo<CompiledVar<T> | CompiledOr<T>> };
export type CompiledOr<T> = { type: 'or'; items: AtLeastTwo<CompiledVar<T> | CompiledAnd<T>> };
export type CompiledConst = { readonly type: 'const'; value: boolean };

function otherOperation(operation: 'and' | 'or'): 'and' | 'or' {
    return operation === 'and' ? 'or' : 'and';
}
function neutralElementOf(operation: 'and' | 'or'): boolean {
    return operation === 'and';
}
function negateInPlace<T>(condition: CompiledCondition<T>): void {
    if (condition.type === 'var') {
        condition.negated = !condition.negated;
        return;
    }
    if (condition.type === 'const') {
        condition.value = !condition.value;
        return;
    }

    // De-Morgan
    condition.type = otherOperation(condition.type);
    condition.items.forEach(negateInPlace);
}
/**
 * Optimizes the given condition and converts it into a form that is more optimal for evaluation.
 */
export function compileCondition<T>(condition: Readonly<Condition<T>>): CompiledCondition<T> {
    if (typeof condition === 'boolean') {
        return { type: 'const', value: condition };
    }
    if (condition.type === 'var') {
        return { type: 'var', value: condition.value, negated: false };
    }
    if (condition.type === 'not') {
        const c = compileCondition(condition.item);
        negateInPlace(c);
        return c;
    }

    const neutral = neutralElementOf(condition.type);

    // trivial
    if (condition.items.length === 0) {
        return { type: 'const', value: neutral };
    }
    if (condition.items.length === 1) {
        return compileCondition(condition.items[0]);
    }

    const items: (CompiledVar<T> | CompiledAnd<T> | CompiledOr<T>)[] = [];
    const vars = new Set<T>();
    const negVars = new Set<T>();
    for (const item of condition.items.map(compileCondition)) {
        if (item.type === 'const') {
            if (item.value === neutral) {
                // it's neutral, so we don't need to include it
            } else {
                // this means that it's the absorbing element
                return item;
            }
        } else if (item.type === 'var' || item.type === condition.type) {
            for (const i of item.type === 'var' ? [item] : item.items) {
                if (i.type === 'var') {
                    const opposite = i.negated ? vars : negVars;
                    if (opposite.has(i.value)) {
                        // we just found a∧¬a == false or a∨¬a == true
                        return { type: 'const', value: !neutral };
                    }

                    const target = i.negated ? negVars : vars;
                    if (!target.has(i.value)) {
                        // only add non-duplicate variables
                        target.add(i.value);
                        items.push(i);
                    }
                } else {
                    items.push(i);
                }
            }
        } else {
            items.push(item);
        }
    }

    if (items.length === 0) {
        return { type: 'const', value: neutral };
    }
    if (items.length === 1) {
        return items[0];
    }
    return { type: condition.type, items: items as never };
}

export function testCondition<T>(condition: CompiledCondition<T>, resolveVariable: (variable: T) => boolean): boolean {
    const evaluate = (c: CompiledCondition<T>): boolean => {
        switch (c.type) {
            case 'const':
                return c.value;
            case 'var':
                return resolveVariable(c.value) !== c.negated;
            case 'and':
                return c.items.every(evaluate);
            case 'or':
                return c.items.some(evaluate);
            default:
                return assertNever(c);
        }
    };
    return evaluate(condition);
}
