import { NextApiRequest, NextApiResponse } from 'next';
import { delay } from './util';

// eslint-disable-next-line @typescript-eslint/ban-types
export type UpdateRequest<Id, Value extends {}> = ChangeRequest<Id, Value> | DeleteRequest<Id>;
export type ChangeRequest<Id, Value> = { id: Id; value: Value };
export type DeleteRequest<Id> = { id: Id; value?: undefined };

interface GroupedChangeRequests<Id, Value> {
    change: Map<Id, Value>;
    delete: Set<Id>;
}
// eslint-disable-next-line @typescript-eslint/ban-types
export function groupUpdatesByType<Id extends string, Value extends {}>(
    updates: Iterable<UpdateRequest<Id, Value>>
): GroupedChangeRequests<Id, Value> {
    const result: GroupedChangeRequests<Id, Value> = {
        change: new Map(),
        delete: new Set(),
    };
    for (const update of updates) {
        if (update.value === undefined) {
            result.delete.add(update.id);
        } else {
            result.change.set(update.id, update.value);
        }
    }
    return result;
}

export function post<T>(handler: (body: T, req: NextApiRequest) => Promise<void> | void) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        try {
            const body = JSON.parse(req.body as string) as T;
            await handler(body, req);
            res.status(200).json({ ok: true });
        } catch (err) {
            res.status(500).json({ error: String(err) });
        }
    };
}

let dbLocked = false;
export function synchronizeDB<A extends unknown[]>(
    handler: (...args: A) => Promise<void>
): (...args: A) => Promise<void> {
    return async (...args) => {
        // a simple spin lock to act as a mutex
        while (dbLocked) {
            await delay(10);
        }

        dbLocked = true;
        try {
            await handler(...args);
        } finally {
            dbLocked = false;
        }
    };
}
