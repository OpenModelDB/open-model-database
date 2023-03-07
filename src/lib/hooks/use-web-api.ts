import { useEffect, useState } from 'react';
import { DBApi } from '../data-api';
import { noop } from '../util';
import { getWebApi } from '../web-api';

export type UseWebApi = { webApi: DBApi; editMode: true } | { webApi: undefined; editMode: false };

export function useWebApi(): UseWebApi {
    const [webApi, setWebApi] = useState<DBApi>();

    useEffect(() => {
        getWebApi().then(setWebApi, noop);
    }, []);

    return webApi ? { webApi, editMode: true } : { webApi, editMode: false };
}
