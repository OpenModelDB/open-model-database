import { NextApiRequest, NextApiResponse } from 'next';
import { CollectionApi } from '../data-api';
import { JsonRequest, JsonResponse, createCollectionRequestHandler } from '../data-json-api';

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

export function handleJsonApi<Id, Value>(collection: CollectionApi<Id, Value>) {
    const handler = createCollectionRequestHandler(collection);

    return async (req: NextApiRequest, res: NextApiResponse) => {
        try {
            const reqJson = JSON.parse(req.body as string) as JsonRequest<Id, Value>;
            const resJson: JsonResponse<Id, Value> = { data: await handler(reqJson.method, reqJson.data) };
            res.status(200).json(resJson);
        } catch (err) {
            console.error(err);

            let message = String(err);
            if (err instanceof Error) {
                message += `\n${String(err.stack)}`;
            }
            res.status(500).json({ error: message });
        }
    };
}
