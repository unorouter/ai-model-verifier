export function makeNonce() {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
export function nonceTag(nonce) {
    return `Begin your reply with the tag [${nonce}] then a space, then your answer.`;
}
export function echoesNonce(text, nonce) {
    return text.includes(nonce.toLowerCase());
}
//# sourceMappingURL=nonce.js.map