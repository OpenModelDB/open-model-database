import { NextApiRequest, NextApiResponse } from 'next';
import { UrlNotAllowedError, safeFetchText } from '../../lib/server/safe-fetch';

interface Body {
    url: string;
}

export default async function fetchReq(req: NextApiRequest, res: NextApiResponse) {
    try {
        const body = JSON.parse(req.body as string) as Body;
        const text = await safeFetchText(body.url);
        res.status(200).json({ ok: true, data: text });
    } catch (err) {
        // A rejected URL is the caller's mistake and an upstream failure is not,
        // so they get different statuses — otherwise "you pasted a link we do
        // not support" and "imgbox is down" are the same 500.
        const status = err instanceof UrlNotAllowedError ? 400 : 500;
        res.status(status).json({ ok: false, error: String(err) });
    }
}
