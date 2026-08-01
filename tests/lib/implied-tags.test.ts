import { describe, expect, it } from 'vitest';
import { addImpliedTags, removeImplyingTags, withImpliedTags } from '../../src/lib/implied-tags';
import { Tag, TagId } from '../../src/lib/schema';

const tag = (name: string, implies?: string[]): Tag => ({ name, description: '', implies: implies as TagId[] });

/**
 * anime implies cartoon implies illustration, so the chain exercises the
 * transitive cases rather than a single hop.
 */
const tagData = new Map<TagId, Tag>([
    ['anime' as TagId, tag('Anime', ['cartoon'])],
    ['cartoon' as TagId, tag('Cartoon', ['illustration'])],
    ['illustration' as TagId, tag('Illustration')],
    ['photo' as TagId, tag('Photo')],
]);

const ids = (...names: string[]) => new Set(names as TagId[]);

describe('addImpliedTags', () => {
    it('adds what a tag implies', () => {
        const tags = ids('cartoon');
        addImpliedTags(tags, tagData);

        expect([...tags].sort()).toEqual(['cartoon', 'illustration']);
    });

    it('follows the chain transitively', () => {
        // Relies on the set being iterated as it grows — anime pulls in
        // cartoon, and cartoon must then pull in illustration.
        const tags = ids('anime');
        addImpliedTags(tags, tagData);

        expect([...tags].sort()).toEqual(['anime', 'cartoon', 'illustration']);
    });

    it('leaves a tag with no implications alone', () => {
        const tags = ids('photo');
        addImpliedTags(tags, tagData);

        expect([...tags]).toEqual(['photo']);
    });

    it('ignores ids it has no data for', () => {
        const tags = ids('nonexistent');
        addImpliedTags(tags, tagData);

        expect([...tags]).toEqual(['nonexistent']);
    });
});

describe('withImpliedTags', () => {
    it('returns a sorted list without mutating the input', () => {
        const input = ['anime' as TagId];

        expect(withImpliedTags(input, tagData)).toEqual(['anime', 'cartoon', 'illustration']);
        expect(input).toEqual(['anime']);
    });

    it('deduplicates when two tags imply the same thing', () => {
        expect(withImpliedTags(['anime', 'cartoon'] as TagId[], tagData)).toEqual(['anime', 'cartoon', 'illustration']);
    });
});

describe('removeImplyingTags', () => {
    it('removes a tag whose implication is missing', () => {
        // Unticking "cartoon" has to untick "anime" too, or the model claims a
        // tag whose prerequisite it does not have.
        const tags = ids('anime', 'illustration');
        removeImplyingTags(tags, tagData);

        expect([...tags]).toEqual(['illustration']);
    });

    it('cascades up the whole chain in one pass', () => {
        // Dropping illustration invalidates cartoon, which invalidates anime.
        // This is what the do/while loop in the implementation is for.
        const tags = ids('anime', 'cartoon');
        removeImplyingTags(tags, tagData);

        expect([...tags]).toEqual([]);
    });

    it('keeps a complete set intact', () => {
        const tags = ids('anime', 'cartoon', 'illustration');
        removeImplyingTags(tags, tagData);

        expect([...tags].sort()).toEqual(['anime', 'cartoon', 'illustration']);
    });

    it('leaves independent tags untouched', () => {
        const tags = ids('photo');
        removeImplyingTags(tags, tagData);

        expect([...tags]).toEqual(['photo']);
    });
});
