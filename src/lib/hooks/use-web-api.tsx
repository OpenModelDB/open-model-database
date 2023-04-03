import React, { createContext, useContext, useEffect, useState } from 'react';
import { DBApi } from '../data-api';
import { noop } from '../util';
import { getWebApi } from '../web-api';

const WebApiContext = createContext<DBApi | undefined>(undefined);

export function WebApiProvider({ children }: React.PropsWithChildren<unknown>) {
    const [webApi, setWebApi] = useState<DBApi>();

    useEffect(() => {
        getWebApi().then(setWebApi, noop);
    }, []);

    return <WebApiContext.Provider value={webApi}>{children}</WebApiContext.Provider>;
}

export type UseWebApi = { webApi: DBApi; editMode: true } | { webApi: undefined; editMode: false };

export function useWebApi(): UseWebApi {
    const webApi = useContext(WebApiContext);

    return webApi ? { webApi, editMode: true } : { webApi, editMode: false };
}
