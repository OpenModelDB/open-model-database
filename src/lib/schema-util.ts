import { UserId } from './schema';

export const ModelIdPattern = /^\d+x-[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/;
export const UserIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const TagIdPattern = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/;

export function canonicalizeUserId(id: string): UserId {
    return id.trim().toLowerCase().replace(/\W+/g, '-').replace(/^-|-$/g, '') as UserId;
}
