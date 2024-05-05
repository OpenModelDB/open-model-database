import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DBApi } from '../data-api';
import { IS_DEPLOYED } from '../site-data';
import { noop } from '../util';
import { getWebApi } from '../web-api';

interface WebApiState {
    webApi: DBApi | undefined;
    enabled: boolean;
    toggleEnabled: () => void;
}

const WebApiContext = createContext<WebApiState>({ webApi: undefined, enabled: false, toggleEnabled: noop });

export function WebApiProvider({ children }: React.PropsWithChildren<unknown>) {
    const [webApi, setWebApi] = useState<DBApi>();

    useEffect(() => {
        getWebApi().then(setWebApi, noop);
    }, []);

    const [enabled, setEnabled] = useState(true);
    const toggleEnabled = useCallback(() => setEnabled((p) => !p), []);

    return <WebApiContext.Provider value={{ webApi, enabled, toggleEnabled }}>{children}</WebApiContext.Provider>;
}

export type UseWebApi = { webApi: DBApi; editMode: true } | { webApi: undefined; editMode: false };

export function useWebApi(): UseWebApi {
    const { webApi, enabled } = useContext(WebApiContext);

    return webApi && enabled ? { webApi, editMode: true } : { webApi: undefined, editMode: false };
}

export interface UseEditModeToggle {
    editMode: boolean;
    editModeAvailable: boolean;
    toggleEditMode: () => void;
}

export function useEditModeToggle(): UseEditModeToggle {
    const { webApi, enabled, toggleEnabled } = useContext(WebApiContext);

    const editModeAvailable = webApi !== undefined && !IS_DEPLOYED;

    return {
        editModeAvailable,
        editMode: editModeAvailable && enabled,
        toggleEditMode: toggleEnabled,
    };
}
