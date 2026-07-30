// `BufferSource` rather than `ArrayBufferView | ArrayBuffer`: TypeScript 5.7
// made ArrayBufferView generic over its buffer, so the hand-written union now
// admits SharedArrayBuffer-backed views that `crypto.subtle.digest` rejects.
// `BufferSource` is the type the Web Crypto signature actually asks for.
export async function hashSha256(input: BufferSource): Promise<string> {
    const sha256 = await crypto.subtle.digest('SHA-256', input);
    const hashArray = Array.from(new Uint8Array(sha256));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex.toLowerCase();
}
