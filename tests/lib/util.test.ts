import { describe, expect, it } from 'vitest';
import { TagId } from '../../src/lib/schema';
import {
    asArray,
    capitalize,
    compareTagId,
    getColorMode,
    isDerivedTag,
    joinClasses,
    joinListString,
    withoutHash,
} from '../../src/lib/util';

describe('joinClasses', () => {
    it('joins the truthy names with a single space', () => {
        expect(joinClasses('a', 'b', 'c')).toBe('a b c');
    });

    it('drops the falsy branches conditionals produce', () => {
        // The `cond && 'class'` idiom used all over the components.
        expect(joinClasses('a', false, undefined, null, '', 'b')).toBe('a b');
    });

    it('returns an empty string when nothing survives', () => {
        expect(joinClasses(false, undefined, null)).toBe('');
    });
});

describe('asArray', () => {
    it('wraps a lone value', () => {
        expect(asArray('a')).toEqual(['a']);
    });

    it('passes an array through untouched', () => {
        const input = ['a', 'b'];

        expect(asArray(input)).toBe(input);
    });

    it('treats an empty array as empty rather than wrapping it', () => {
        expect(asArray([])).toEqual([]);
    });
});

describe('compareTagId', () => {
    const sort = (ids: string[]) => [...ids].sort((a, b) => compareTagId(a as TagId, b as TagId));

    it('sorts uncategorised tags before categorised ones', () => {
        expect(sort(['arch:esrgan', 'anime'])).toEqual(['anime', 'arch:esrgan']);
    });

    it('groups by category first, then by full id', () => {
        expect(sort(['scale:4', 'arch:span', 'arch:esrgan', 'scale:2'])).toEqual([
            'arch:esrgan',
            'arch:span',
            'scale:2',
            'scale:4',
        ]);
    });

    it('is stable for equal ids', () => {
        expect(compareTagId('anime' as TagId, 'anime' as TagId)).toBe(0);
    });
});

describe('isDerivedTag', () => {
    it('treats a namespaced id as derived', () => {
        expect(isDerivedTag('arch:esrgan' as TagId)).toBe(true);
    });

    it('treats a bare id as manual', () => {
        // The tag editor relies on this to decide what a human may toggle.
        expect(isDerivedTag('anime' as TagId)).toBe(false);
    });
});

describe('getColorMode', () => {
    it('names the channel counts it knows', () => {
        expect(getColorMode(1)).toBe('Grayscale');
        expect(getColorMode(3)).toBe('RGB');
        expect(getColorMode(4)).toBe('RGBA');
    });

    it('falls back to the raw count for anything else', () => {
        expect(getColorMode(2)).toBe(2);
        expect(getColorMode(0)).toBe(0);
    });
});

describe('joinListString', () => {
    it('says none for an empty list', () => {
        expect(joinListString([])).toBe('none');
    });

    it('returns a single element as-is', () => {
        expect(joinListString(['a'])).toBe('a');
    });

    it('joins a pair with the conjunction and no comma', () => {
        expect(joinListString(['a', 'b'])).toBe('a and b');
        expect(joinListString(['a', 'b'], 'or')).toBe('a or b');
    });

    it('uses commas plus the conjunction for three or more', () => {
        expect(joinListString(['a', 'b', 'c'])).toContain('a');
        expect(joinListString(['a', 'b', 'c'])).toContain('and c');
    });
});

describe('withoutHash', () => {
    it('strips the fragment', () => {
        expect(withoutHash('/models/foo#images')).toBe('/models/foo');
    });

    it('strips a trailing slash by default', () => {
        expect(withoutHash('/models/')).toBe('/models');
    });

    it('keeps the trailing slash when asked to', () => {
        expect(withoutHash('/models/', false)).toBe('/models/');
    });

    it('leaves a plain path alone', () => {
        expect(withoutHash('/models/foo')).toBe('/models/foo');
    });
});

describe('capitalize', () => {
    it('uppercases the first character only', () => {
        expect(capitalize('hello world')).toBe('Hello world');
    });

    it('leaves an empty string alone', () => {
        expect(capitalize('')).toBe('');
    });
});
