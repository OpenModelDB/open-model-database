import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { SITE_URL } from '../site-data';

/**
 * Returns the pathname of the current route.
 *
 * In contrast to `useRoute().asPath`, the returned string will be consistent on the client and the server.
 * In practice, this means that the returned path won't have a hash.
 */
export function useCurrentPath(): string {
    const { asPath } = useRouter();

    return useMemo(() => new URL(asPath, SITE_URL).pathname, [asPath]);
}
