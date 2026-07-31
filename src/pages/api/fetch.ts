import { NextApiRequest, NextApiResponse } from 'next';
import dns from 'dns';
import net from 'net';

interface Body {
    url: string;
}

const ALLOWED_PROTOCOLS = ['https:'];

function isPrivateIp(ip: string): boolean {
    if (net.isIPv4(ip)) {
        const parts = ip.split('.').map(Number);
        if (parts[0] === 10) return true;
        if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
        if (parts[0] === 192 && parts[1] === 168) return true;
        if (parts[0] === 127) return true;
        if (parts[0] === 169 && parts[1] === 254) return true;
        if (parts[0] === 0) return true;
    }
    if (net.isIPv6(ip)) {
        const lower = ip.toLowerCase();
        if (lower === '::1' || lower === '::') return true;
        if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
        if (lower.startsWith('fe80')) return true;
    }
    return false;
}

async function validateUrl(urlStr: string): Promise<void> {
    let parsed: URL;
    try {
        parsed = new URL(urlStr);
    } catch {
        throw new Error('Invalid URL');
    }
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
        throw new Error('Protocol not allowed');
    }
    const hostname = parsed.hostname;
    if (isPrivateIp(hostname)) {
        throw new Error('Internal addresses are not allowed');
    }
    const addresses = await dns.promises.lookup(hostname, { all: true });
    for (const addr of addresses) {
        if (isPrivateIp(addr.address)) {
            throw new Error('Internal addresses are not allowed');
        }
    }
}

export default async function fetchReq(req: NextApiRequest, res: NextApiResponse) {
    try {
        const body = JSON.parse(req.body as string) as Body;
        await validateUrl(body.url);
        const text = await fetch(body.url).then((res) => res.text());
        res.status(200).json({ ok: true, data: text });
    } catch (err) {
        res.status(500).json({ ok: false, error: String(err) });
    }
}
