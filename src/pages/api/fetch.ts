import { NextApiRequest, NextApiResponse } from 'next';

interface Body {
    url: string;
}

export default async function fetchReq(req: NextApiRequest, res: NextApiResponse) {
    try {
        const body = JSON.parse(req.body as string) as Body;
        const text = await fetch(body.url).then((res) => res.text());
        res.status(200).json({ ok: true, data: text });
    } catch (err) {
        res.status(500).json({ ok: false, error: String(err) });
    }
}
