import { mkdir, writeFile } from 'fs/promises';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { DATA_DIR } from '../../lib/server/file-data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const dir = path.join(DATA_DIR, 'model-files');
        await mkdir(dir, { recursive: true });

        const name = String(req.query.name);
        await writeFile(path.join(DATA_DIR, 'model-files', name), req);
        res.status(200).json({ status: 'ok' });
    } catch (err) {
        console.error(err);

        let message = String(err);
        if (err instanceof Error) {
            message += `\n${String(err.stack)}`;
        }
        res.status(500).json({ error: message });
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};
