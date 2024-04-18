import React from 'react';
import { useIsClient } from '../../lib/hooks/use-is-client';

export function ClientOnly({ children }: React.PropsWithChildren<unknown>) {
    const isClient = useIsClient();
    return isClient ? <>{children}</> : null;
}
