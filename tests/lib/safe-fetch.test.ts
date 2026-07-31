import { describe, expect, it, vi } from 'vitest';
import { isFetchableHost } from '../../src/lib/fetchable-hosts';
import { UrlNotAllowedError, assertSafeUrl, isPrivateAddress, safeFetchText } from '../../src/lib/server/safe-fetch';

/**
 * `assertSafeUrl` resolves the hostname, so every test that reaches that stage
 * has to say what DNS returns. Real lookups would make the suite depend on the
 * network and on imgbox's current A records.
 */
vi.mock('node:dns', () => ({
    default: {
        promises: {
            lookup: (hostname: string) => {
                const addresses = dnsResponses.get(hostname);
                if (!addresses) {
                    return Promise.reject(new Error(`ENOTFOUND ${hostname}`));
                }
                return Promise.resolve(
                    addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 }))
                );
            },
        },
    },
}));

const dnsResponses = new Map<string, string[]>([
    ['imgsli.com', ['93.184.216.34']],
    ['slow.pics', ['93.184.216.34']],
    ['imgbox.com', ['93.184.216.34']],
    ['images2.imgbox.com', ['93.184.216.34']],
    // The rebinding case: an allowlisted host whose DNS points inside.
    ['evil.imgbox.com', ['127.0.0.1']],
]);

describe('isPrivateAddress', () => {
    it.each([
        ['0.0.0.0', 'unspecified'],
        ['0.1.2.3', '0.0.0.0/8'],
        ['10.0.0.1', 'RFC1918 10/8'],
        ['100.64.0.1', 'CGNAT'],
        ['100.127.255.255', 'CGNAT upper bound'],
        ['127.0.0.1', 'loopback'],
        ['169.254.169.254', 'cloud metadata'],
        ['172.16.0.1', 'RFC1918 lower bound'],
        ['172.31.255.255', 'RFC1918 upper bound'],
        ['192.0.0.1', 'IETF protocol assignments'],
        ['192.168.1.1', 'RFC1918 192.168/16'],
        ['198.18.0.1', 'benchmarking'],
        ['224.0.0.1', 'multicast'],
        ['255.255.255.255', 'broadcast'],
    ])('rejects %s (%s)', (ip) => {
        expect(isPrivateAddress(ip)).toBe(true);
    });

    it.each([
        // The boundaries either side of RFC1918's 172.16/12 are the ones a
        // hand-written check gets wrong.
        ['172.15.255.255'],
        ['172.32.0.0'],
        ['100.63.255.255'],
        ['100.128.0.0'],
        ['93.184.216.34'],
        ['8.8.8.8'],
    ])('accepts public %s', (ip) => {
        expect(isPrivateAddress(ip)).toBe(false);
    });

    it.each([
        ['::1', 'loopback'],
        ['::', 'unspecified'],
        ['fc00::1', 'unique local'],
        ['fd12:3456::1', 'unique local'],
        ['fe80::1', 'link local'],
        ['ff02::1', 'multicast'],
    ])('rejects IPv6 %s (%s)', (ip) => {
        expect(isPrivateAddress(ip)).toBe(true);
    });

    it('accepts public IPv6', () => {
        expect(isPrivateAddress('2606:2800:220:1:248:1893:25c8:1946')).toBe(false);
    });

    /**
     * A string check on the IPv6 text misses these entirely: they neither start
     * with `fc`/`fd`/`fe80` nor equal `::1`, but they route to loopback.
     */
    it.each([['::ffff:127.0.0.1'], ['::ffff:169.254.169.254'], ['::FFFF:10.0.0.1']])('rejects IPv4-mapped %s', (ip) => {
        expect(isPrivateAddress(ip)).toBe(true);
    });

    it('accepts an IPv4-mapped public address', () => {
        expect(isPrivateAddress('::ffff:8.8.8.8')).toBe(false);
    });

    it('is not fooled by a non-address string', () => {
        expect(isPrivateAddress('not-an-ip')).toBe(false);
    });
});

describe('isFetchableHost', () => {
    it.each([['imgsli.com'], ['slow.pics'], ['imgbox.com'], ['images2.imgbox.com'], ['IMGBOX.COM']])(
        'accepts %s',
        (host) => {
            expect(isFetchableHost(host)).toBe(true);
        }
    );

    /**
     * The suffix match has to anchor on a dot. Both of these contain the
     * allowlisted host as a substring and neither belongs to it.
     */
    it.each([['imgbox.com.evil.com'], ['evilimgbox.com'], ['imgur.com'], ['localhost'], ['127.0.0.1']])(
        'rejects %s',
        (host) => {
            expect(isFetchableHost(host)).toBe(false);
        }
    );
});

describe('assertSafeUrl', () => {
    it('accepts an allowlisted https url', async () => {
        const url = await assertSafeUrl('https://imgbox.com/abc123');
        expect(url.href).toBe('https://imgbox.com/abc123');
    });

    it('accepts a subdomain of an allowlisted host', async () => {
        await expect(assertSafeUrl('https://images2.imgbox.com/cc/e1/x_o.png')).resolves.toBeInstanceOf(URL);
    });

    it('rejects a malformed url', async () => {
        await expect(assertSafeUrl('not a url')).rejects.toThrow(UrlNotAllowedError);
    });

    it('rejects http', async () => {
        await expect(assertSafeUrl('http://imgbox.com/abc123')).rejects.toThrow(/protocol/i);
    });

    it('rejects a non-allowlisted host', async () => {
        await expect(assertSafeUrl('https://example.com/')).rejects.toThrow(/not allowed/i);
    });

    it('rejects a host that merely ends with an allowlisted name', async () => {
        await expect(assertSafeUrl('https://imgbox.com.evil.com/')).rejects.toThrow(/not allowed/i);
    });

    /** Rejected by the allowlist before DNS is ever consulted. */
    it.each([['https://127.0.0.1/'], ['https://169.254.169.254/latest/meta-data/'], ['https://[::1]/']])(
        'rejects the address literal %s',
        async (url) => {
            await expect(assertSafeUrl(url)).rejects.toThrow(UrlNotAllowedError);
        }
    );

    /** Layer 2: allowlisted name, but it resolves inside. */
    it('rejects an allowlisted host that resolves to a private address', async () => {
        await expect(assertSafeUrl('https://evil.imgbox.com/')).rejects.toThrow(/resolves/i);
    });
});

type Step = { status: number; location?: string } | { status: number; body: string };

/** Builds a `fetch` stub that walks a scripted list of responses. */
function stubFetch(steps: Step[]) {
    const calls: string[] = [];
    let i = 0;
    // `_init` is unused, but declaring it is what lets a test assert that the
    // caller passed `redirect: 'manual'`.
    const fn = vi.fn((input: URL | string, _init?: RequestInit) => {
        calls.push(String(input));
        // `.at` rather than `[]` so overrunning the script is a typed
        // possibility and the guard below is not dead code.
        const step = steps.at(i++);
        if (!step) throw new Error('fetch called more times than the test scripted');
        const headers = new Headers();
        if ('location' in step && step.location) headers.set('location', step.location);
        return Promise.resolve({
            status: step.status,
            headers,
            text: () => Promise.resolve('body' in step ? step.body : ''),
        } as Response);
    });
    return { fn, calls };
}

describe('safeFetchText', () => {
    it('returns the body when there is no redirect', async () => {
        const { fn, calls } = stubFetch([{ status: 200, body: '<html>ok</html>' }]);
        vi.stubGlobal('fetch', fn);

        await expect(safeFetchText('https://imgbox.com/abc123')).resolves.toBe('<html>ok</html>');
        expect(calls).toEqual(['https://imgbox.com/abc123']);

        vi.unstubAllGlobals();
    });

    it('follows a redirect within the allowlist', async () => {
        const { fn, calls } = stubFetch([
            { status: 302, location: 'https://images2.imgbox.com/final.png' },
            { status: 200, body: 'final' },
        ]);
        vi.stubGlobal('fetch', fn);

        await expect(safeFetchText('https://imgbox.com/abc123')).resolves.toBe('final');
        expect(calls).toEqual(['https://imgbox.com/abc123', 'https://images2.imgbox.com/final.png']);

        vi.unstubAllGlobals();
    });

    it('resolves a relative Location against the current url', async () => {
        const { fn, calls } = stubFetch([
            { status: 301, location: '/canonical/' },
            { status: 200, body: 'ok' },
        ]);
        vi.stubGlobal('fetch', fn);

        await expect(safeFetchText('https://slow.pics/c/abc')).resolves.toBe('ok');
        expect(calls[1]).toBe('https://slow.pics/canonical/');

        vi.unstubAllGlobals();
    });

    /**
     * The bypass that a validate-once implementation misses: the first request
     * goes to a host we allow, and its response points at cloud metadata.
     */
    it('rejects a redirect to an internal address', async () => {
        const { fn } = stubFetch([{ status: 302, location: 'http://169.254.169.254/latest/meta-data/' }]);
        vi.stubGlobal('fetch', fn);

        await expect(safeFetchText('https://imgbox.com/abc123')).rejects.toThrow(UrlNotAllowedError);

        vi.unstubAllGlobals();
    });

    it('rejects a redirect off the allowlist', async () => {
        const { fn } = stubFetch([{ status: 302, location: 'https://example.com/' }]);
        vi.stubGlobal('fetch', fn);

        await expect(safeFetchText('https://imgbox.com/abc123')).rejects.toThrow(/not allowed/i);

        vi.unstubAllGlobals();
    });

    it('rejects a 3xx with no Location header', async () => {
        const { fn } = stubFetch([{ status: 302 }]);
        vi.stubGlobal('fetch', fn);

        await expect(safeFetchText('https://imgbox.com/abc123')).rejects.toThrow(/location/i);

        vi.unstubAllGlobals();
    });

    it('gives up after too many redirects', async () => {
        const { fn } = stubFetch(
            Array.from({ length: 10 }, () => ({ status: 302, location: 'https://imgbox.com/loop' }))
        );
        vi.stubGlobal('fetch', fn);

        await expect(safeFetchText('https://imgbox.com/abc123')).rejects.toThrow(/too many redirects/i);

        vi.unstubAllGlobals();
    });

    it('does not let fetch follow redirects on its own', async () => {
        const { fn } = stubFetch([{ status: 200, body: 'ok' }]);
        vi.stubGlobal('fetch', fn);

        await safeFetchText('https://imgbox.com/abc123');
        expect(fn.mock.calls[0][1]).toMatchObject({ redirect: 'manual' });

        vi.unstubAllGlobals();
    });
});
