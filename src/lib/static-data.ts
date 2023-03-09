import tags from '../../data/tags.json';
import users from '../../data/users.json';
import { Tag, TagId, User, UserId } from './schema';

export const STATIC_TAG_DATA: ReadonlyMap<TagId, Tag> = new Map(
    Object.entries(tags).map(([k, v]: [string, Tag]) => {
        return [k as TagId, v];
    })
);

export const STATIC_USER_DATA: ReadonlyMap<UserId, User> = new Map(
    Object.entries(users).map(([k, v]: [string, User]) => {
        return [k as UserId, v];
    })
);
