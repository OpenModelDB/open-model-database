import { ArchId, TagId, UserId } from './schema';

export const ModelIdPattern = /^\d+x-[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/;
export const UserIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ArchIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+|[+])*$/;
export const TagIdPattern = /^(?:[a-z0-9]+:)?[a-z0-9]+(?:-[a-z0-9]+|[+])*$/;

function lowerDashes(s: string, forbidden: RegExp): string {
    return s
        .trim()
        .toLowerCase()
        .replace(new RegExp(`(?:${forbidden.source})+`, 'gi'), '-')
        .replace(/^-|-$/g, '');
}
export function canonicalizeUserId(id: string): UserId {
    return lowerDashes(id, /[^a-z0-9]/) as UserId;
}
export function canonicalizeArchId(id: string): ArchId {
    return lowerDashes(id, /[^a-z0-9+]/) as ArchId;
}
export function canonicalizeTagId(id: string): TagId {
    return lowerDashes(id, /[^a-z0-9+]/) as TagId;
}
