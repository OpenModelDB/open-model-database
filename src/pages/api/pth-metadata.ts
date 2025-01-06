import { exec as execCallback } from 'child_process';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { promisify } from 'util';
import { DATA_DIR } from '../../lib/server/file-data';

const exec = promisify(execCallback);

export interface Metadata {
    architecture: string;
    tags: string[];
    scale: number;
    inputChannels: number;
    outputChannels: number;
}
export type ResponseJson = { status: 'ok'; data: Metadata } | { status: 'error'; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const dir = path.join(DATA_DIR, 'model-files');
        await mkdir(dir, { recursive: true });

        const temp = path.join(DATA_DIR, 'model-files', `__temp${Math.random()}.pth`);
        await writeFile(temp, req);

        let metadata;
        try {
            const { stdout } = await exec(`python invoke-spandrel.py "${temp}"`);
            let m = /^SUCCESS:\s*(\{.*\})$/m.exec(stdout);
            if (m) {
                metadata = JSON.parse(m[1]) as Metadata;
            } else if ((m = /^ERROR:\s*(\{.*\})$/m.exec(stdout))) {
                const details = JSON.parse(m[1]) as { message: string };
                res.status(500).json({ status: 'error', error: details.message });
                return;
            } else {
                throw new Error(`Could not parse metadata from stdout:\n${stdout}`);
            }
        } finally {
            await unlink(temp);
        }
        res.status(200).json({ status: 'ok', data: metadata });
    } catch (err) {
        console.error(err);

        let message = String(err);
        if (err instanceof Error) {
            message += `\n${String(err.stack)}`;
        }
        res.status(500).json({ status: 'error', error: message });
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};
