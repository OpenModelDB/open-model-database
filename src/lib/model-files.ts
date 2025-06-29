export async function hashSha256(input: ArrayBufferView | ArrayBuffer): Promise<string> {
    const sha256 = await crypto.subtle.digest('SHA-256', input);
    const hashArray = Array.from(new Uint8Array(sha256));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex.toLowerCase();
}
