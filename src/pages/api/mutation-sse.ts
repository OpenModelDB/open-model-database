import { NextApiRequest, NextApiResponse } from 'next';
import { getFileApiMutationCounter } from '../../lib/server/file-data';
import { delay } from '../../lib/util';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Content-Type', 'text/event-stream;charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');

    let lastCount = NaN;
    let ticksSinceLastMessage = 0;
    for (;;) {
        try {
            await delay(10);
            const count = await getFileApiMutationCounter();
            if (count !== lastCount) {
                lastCount = count;
                ticksSinceLastMessage = 0;
                res.write(`data: ${count}\n\n`);
            } else {
                ticksSinceLastMessage++;

                if (ticksSinceLastMessage > 1000) {
                    ticksSinceLastMessage = 0;
                    res.write(`: keep alive\n\n`);
                }
            }
        } catch (error) {
            console.error(error);
            break;
        }
    }

    res.end('done\n');
}
