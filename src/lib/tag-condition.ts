import { TagCategory, TagId } from './schema';
import { Condition } from './search/logical-condition';

export enum SelectionState {
    Required,
    Forbidden,
}

export type TagSelection = ReadonlyMap<TagId, SelectionState>;

export function getTagCondition(selection: TagSelection, categories: Iterable<TagCategory>): Condition<TagId> {
    if (selection.size === 0) {
        return true;
    }

    const parts: Condition<TagId>[] = [];
    for (const category of categories) {
        const pos: TagId[] = [];
        const neg: TagId[] = [];

        for (const tag of category.tags) {
            const state = selection.get(tag);
            if (state === SelectionState.Required) {
                pos.push(tag);
            } else if (state === SelectionState.Forbidden) {
                neg.push(tag);
            }
        }

        if (pos.length > 0 || neg.length > 0) {
            const p = pos.length === 0 ? true : Condition.or(...pos.map(Condition.variable));
            const n = Condition.not(Condition.or(...neg.map(Condition.variable)));
            parts.push(Condition.and(p, n));
        }
    }

    if (parts.length === 0) {
        return true;
    }
    return Condition.and(...parts);
}
