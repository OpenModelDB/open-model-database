import dns from 'node:dns';
import net from 'node:net';
import { isFetchableHost } from '../fetchable-hosts';

/**
 * Fetching a URL that came from a request body means the server can be aimed at
 * anything it can reach, including services that are only listening because
 * they assumed nobody outside the machine could talk to them. The guard here is
 * three layers, because each one covers a hole the others leave open:
 *
 *  1. A host allowlist. The strongest of the three, and the reason the other
 *     two are cheap: the set of hosts we ever need to fetch is three entries
 *     long, so anything else — including every address literal — is refused
 *     before a packet is sent.
 *  2. A resolved-address check, so an allowlisted name that happens to point at
 *     a private address is still refused.
 *  3. Manual redirect handling, so a response from an allowed host cannot
 *     redirect us somewhere we would never have agreed to fetch directly.
 *
 * Layer 2 does not eliminate DNS rebinding: `fetch` resolves the name again
 * itself, and nothing here pins the address we validated to the socket it opens.
 * Closing that properly needs a custom dispatcher, which is not worth it for a
 * route that only exists under `next dev` — and layer 1 already means an
 * attacker would need authoritative DNS for imgbox, slow.pics or imgsli, at
 * which point the rebinding is the least of the problems.
 */

const MAX_REDIRECTS = 5;

/** Validation failures, kept distinct so the route can answer 400 rather than 500. */
export class UrlNotAllowedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UrlNotAllowedError';
    }
}

function isPrivateIPv4(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;

    if (a === 0) return true; // 0.0.0.0/8 "this network"
    if (a === 10) return true; // RFC1918
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata at 169.254.169.254
    if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
    if (a === 192 && b === 0) return true; // IETF protocol assignments
    if (a === 192 && b === 168) return true; // RFC1918
    if (a === 198 && b >= 18 && b <= 19) return true; // benchmarking
    if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
    if (a >= 224) return true; // multicast, reserved, and the broadcast address

    return false;
}

/**
 * Whether `ip` belongs to a range that should never be reachable from a
 * user-supplied URL.
 *
 * Anything that is not a valid address returns false — callers reject unknown
 * hosts through the allowlist, and reporting a hostname as "private" here would
 * only produce a confusing error.
 */
export function isPrivateAddress(ip: string): boolean {
    if (net.isIPv4(ip)) {
        return isPrivateIPv4(ip);
    }

    if (net.isIPv6(ip)) {
        const lower = ip.toLowerCase();

        // An IPv4-mapped address routes wherever its embedded IPv4 address
        // does, so ::ffff:127.0.0.1 is loopback. Nothing about the IPv6 text
        // says so, which is what makes a prefix check on the string miss it.
        const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(lower);
        if (mapped && net.isIPv4(mapped[1])) {
            return isPrivateIPv4(mapped[1]);
        }

        if (lower === '::' || lower === '::1') return true;
        if (/^f[cd]/.test(lower)) return true; // fc00::/7 unique local
        if (/^fe[89ab]/.test(lower)) return true; // fe80::/10 link local
        if (/^ff/.test(lower)) return true; // ff00::/8 multicast

        return false;
    }

    return false;
}

/**
 * Parses `raw` and rejects it unless it is an https URL on an allowlisted host
 * that resolves to a public address.
 */
export async function assertSafeUrl(raw: string | URL): Promise<URL> {
    let url: URL;
    try {
        url = new URL(raw);
    } catch {
        throw new UrlNotAllowedError(`Invalid URL: ${String(raw)}`);
    }

    if (url.protocol !== 'https:') {
        throw new UrlNotAllowedError(`Protocol not allowed: ${url.protocol}`);
    }

    // `URL.hostname` keeps the brackets around an IPv6 literal, and `net.isIPv6`
    // does not accept them — so `[::1]` reads as "not an IP address" unless they
    // come off first.
    const hostname = url.hostname.replace(/^\[|\]$/g, '');

    if (!isFetchableHost(hostname)) {
        throw new UrlNotAllowedError(`Host not allowed: ${hostname}`);
    }

    const addresses = await dns.promises.lookup(hostname, { all: true });
    for (const { address } of addresses) {
        if (isPrivateAddress(address)) {
            throw new UrlNotAllowedError(`Host resolves to a private address: ${hostname} -> ${address}`);
        }
    }

    return url;
}

/**
 * Fetches `raw` as text, validating the initial URL and every redirect it
 * follows.
 */
export async function safeFetchText(raw: string): Promise<string> {
    let url = await assertSafeUrl(raw);

    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
        const res = await fetch(url, { redirect: 'manual' });

        if (res.status < 300 || res.status >= 400) {
            return await res.text();
        }

        const location = res.headers.get('location');
        if (!location) {
            throw new Error(`Redirect with no Location header from ${url.href}`);
        }

        // Relative redirects are common and legal, so resolve against the URL we
        // just requested before revalidating.
        url = await assertSafeUrl(new URL(location, url));
    }

    throw new Error(`Too many redirects starting from ${String(raw)}`);
}
