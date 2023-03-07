import { constants } from 'fs';
import fs, { readFile, writeFile } from 'fs/promises';

export function fileExists(file: string): Promise<boolean> {
    return fs.access(file, constants.F_OK).then(
        () => true,
        () => false
    );
}

interface CacheEntry<T> {
    value: T;
    timestamp: number;
}

export class JsonFile<T> {
    private cached: CacheEntry<T> | undefined;
    readonly path: string;
    readonly ttl: number;

    constructor(path: string, ttl = 3_000) {
        this.path = path;
        this.ttl = ttl;
    }

    async read(): Promise<T> {
        if (this.cached && Date.now() - this.cached.timestamp < this.ttl) {
            return this.cached.value;
        }

        const content = await readFile(this.path, 'utf-8');
        const value = JSON.parse(content) as T;
        this.cached = { value, timestamp: Date.now() };
        return value;
    }
    async write(value: T): Promise<void> {
        this.cached = { value, timestamp: Date.now() };
        await writeFile(this.path, JSON.stringify(value, undefined, 4), 'utf-8');
    }
    async update(supplier: (old: T) => T): Promise<void> {
        const value = supplier(await this.read());
        await this.write(value);
    }
}
