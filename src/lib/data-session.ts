import { MapCollection } from './data-api';

export const createMapCollectionFromSessionStorage = <Id, Value>(
    key: string,
    map = new Map<Id, Value>()
): MapCollection<Id, Value> => {
    const cachedItem = sessionStorage.getItem(key);
    if (cachedItem) {
        const data = JSON.parse(sessionStorage.getItem(key) || '{}') as Record<string, Value>;
        for (const [id, value] of Object.entries(data)) {
            // Only add the value if it doesn't already exist
            // AKA only add user-made data, update everything else from api
            if (!map.get(id as Id)) {
                map.set(id as Id, value);
            }
        }
    }
    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem(key, JSON.stringify([...map]));
    });
    return new MapCollection(map);
};
