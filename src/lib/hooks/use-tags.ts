import { Tag, TagId } from '../schema';
import { STATIC_TAG_DATA } from '../static-data';

export interface UseTags {
    readonly tagData: ReadonlyMap<TagId, Tag>;
}

const result: UseTags = {
    tagData: STATIC_TAG_DATA,
};

export function useTags(): UseTags {
    return result;
}
