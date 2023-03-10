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

export interface JsonFileOptions<T> {
    ttl?: number;
    stringify?: (data: T) => string;
    parse?: (json: string) => T;
    beforeWrite?: (data: T) => T;
}

export class JsonFile<T> {
    private cached: CacheEntry<T> | undefined;
    readonly path: string;
    readonly ttl: number;
    readonly parse: (json: string) => T;
    readonly stringify: (data: T) => string;
    readonly beforeWrite: (data: T) => T;

    constructor(
        path: string,
        {
            ttl = 3_000,
            parse = (s) => JSON.parse(s) as T,
            stringify = (value) => JSON.stringify(value, undefined, 4),
            beforeWrite = (x) => x,
        }: Readonly<JsonFileOptions<T>> = {}
    ) {
        this.path = path;
        this.ttl = ttl;
        this.parse = parse;
        this.stringify = stringify;
        this.beforeWrite = beforeWrite;
    }

    async read(): Promise<T> {
        if (this.cached && Date.now() - this.cached.timestamp < this.ttl) {
            return this.cached.value;
        }

        const content = await readFile(this.path, 'utf-8');
        const value = this.parse(content);
        this.cached = { value, timestamp: Date.now() };
        return value;
    }
    async write(value: T): Promise<void> {
        value = this.beforeWrite(value);
        this.cached = { value, timestamp: Date.now() };
        await writeFile(this.path, this.stringify(value), 'utf-8');
    }
    async update(supplier: (old: T) => T): Promise<void> {
        const value = supplier(await this.read());
        await this.write(value);
    }
}
