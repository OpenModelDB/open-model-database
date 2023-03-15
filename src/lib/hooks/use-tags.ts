import { Tag, TagCategory, TagCategoryId, TagId } from '../schema';
import { STATIC_TAG_CATEGORY_DATA, STATIC_TAG_DATA } from '../static-data';
import { getTagCategoryOrder } from '../util';

export interface UseTags {
    readonly tagData: ReadonlyMap<TagId, Tag>;
    readonly tagCategoryData: ReadonlyMap<TagCategoryId, TagCategory>;
    readonly categoryOrder: readonly (readonly [TagCategoryId, TagCategory])[];
}

const result: UseTags = {
    tagData: STATIC_TAG_DATA,
    tagCategoryData: STATIC_TAG_CATEGORY_DATA,
    categoryOrder: getTagCategoryOrder(STATIC_TAG_CATEGORY_DATA),
};

export function useTags(): UseTags {
    return result;
}
