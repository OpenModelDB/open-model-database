import { ArchId, ModelId, TagId, UserId } from './schema';

export const ModelIdPattern = /^\d+x-[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/;
export const UserIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ArchIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+|[+])*$/;
export const TagIdPattern = /^(?:[a-z0-9]+:)?[a-z0-9]+(?:-[a-z0-9]+|[+])*$/;

function dashes(s: string, forbidden: RegExp): string {
    return s
        .trim()
        .replace(new RegExp(`(?:${forbidden.source})+`, 'gi'), '-')
        .replace(/^-|-$/g, '');
}
function lowerDashes(s: string, forbidden: RegExp): string {
    return dashes(s.toLowerCase(), forbidden);
}
export function canonicalizeModelId(id: string): ModelId {
    // remove invalid characters
    id = dashes(id, /[^a-z0-9]/);

    // remove duplicate scale at start
    id = id.replace(/^(\d+)x-(?:\1x-?|x\1)/i, '$1x-');
    // remove duplicate scale at end
    id = id.replace(/^((\d+)x.*?)-(?:x\2|\2x)$/i, '$1');

    return id as ModelId;
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
