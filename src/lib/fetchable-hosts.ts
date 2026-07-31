/**
 * The hosts we will fetch HTML from to extract image metadata.
 *
 * This is deliberately *not* the same list as the URL prefixes in
 * `extractImage`. Those pick which parser to run, and include hosts we never
 * fetch at all — an `i.imgur.com` or `cdn.discordapp.com` link is already a
 * direct image URL, so it is returned without a request. This list answers a
 * narrower question: which hosts may `/api/fetch` be pointed at.
 *
 * Keeping it in its own module means the dev-only API route and the browser
 * agree on the answer instead of drifting apart.
 */
export const FETCHABLE_HOSTS = ['imgsli.com', 'slow.pics', 'imgbox.com'] as const;

/**
 * Whether `hostname` is an allowlisted host or a subdomain of one.
 *
 * The suffix match anchors on a dot on purpose. Without it, `imgbox.com.evil.com`
 * and `evilimgbox.com` would both pass — the first is a domain the attacker
 * controls, and the second is one they can simply register.
 */
export function isFetchableHost(hostname: string): boolean {
    const host = hostname.toLowerCase();
    return FETCHABLE_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}
