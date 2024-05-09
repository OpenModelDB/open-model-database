export const createMapFromSessionStorage = <Id, Value>(key: string, map = new Map<Id, Value>()): Map<Id, Value> => {
    const cachedItem = sessionStorage.getItem(key);
    if (cachedItem) {
        const cachedMap = new Map<Id, Value>(JSON.parse(cachedItem || '[]') as []);
        for (const id of cachedMap.keys()) {
            // Only add the value if it doesn't already exist
            // AKA only add user-made data, update everything else from api
            if (!map.has(id)) {
                const value = cachedMap.get(id);
                if (value) {
                    map.set(id, value);
                }
            }
        }
    }
    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem(key, JSON.stringify([...map]));
    });
    return map;
};
