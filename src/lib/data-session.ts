import { MapCollection } from './data-api';

export class SessionStorageMapCollection<Id, Value> extends MapCollection<Id, Value> {
    constructor(key: string, map = new Map<Id, Value>()) {
        super();
        const cachedItem = sessionStorage.getItem(key);
        if (cachedItem) {
            const data = JSON.parse(cachedItem) as Array<[Id, Value]>;
            this.map = new Map(data);
        } else {
            this.map = map;
        }
        window.addEventListener('beforeunload', () => {
            sessionStorage.setItem(key, JSON.stringify([...this.map]));
        });
    }
}
