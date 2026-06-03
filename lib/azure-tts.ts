// TODO: ACET-007 — Azure Neural TTS integration
// WHY: Audio is generated server-side and cached in Cloudflare R2 by lang+text hash.
//      The Azure key never leaves the server — this lib calls the Node.js API, not Azure directly.
export {}
