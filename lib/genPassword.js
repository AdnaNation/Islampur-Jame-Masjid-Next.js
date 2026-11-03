const ALPHABET = "abcdefghjkmnpqrstuvwxyzACDEFGHJKLMNPQRTUVWXY346789";

export function genPassword(length = 14) {
  const out = [];
  const limit = 256 - (256 % ALPHABET.length);
  while (out.length < length) {
    const bytes = new Uint8Array(length * 2);
    crypto.getRandomValues(bytes);
    for (const b of bytes) {
      if (b < limit && out.length < length)
        out.push(ALPHABET[b % ALPHABET.length]);
    }
  }
  return out.join("");
}
