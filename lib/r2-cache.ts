// Server-side Cloudflare R2 cache helpers.
// WHY: R2 caches TTS audio by (language, sha256(text)) so the same phrase never
// hits Azure twice. This keeps costs near zero for repeated tile presses.
// SHIELD: This file is server-only. Never import from client/Expo code.

import { createHash } from 'crypto'
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'

// R2 uses the S3-compatible API, with a Cloudflare-specific endpoint.
function getR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  })
}

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET ?? 'acetalks-tts'
const PUBLIC_BASE = process.env.CLOUDFLARE_R2_PUBLIC_URL ?? ''

export function ttsKey(language: string, text: string): string {
  const hash = createHash('sha256').update(text).digest('hex').slice(0, 16)
  return `tts/${language}/${hash}.mp3`
}

export async function getCachedUrl(key: string): Promise<string | null> {
  try {
    const client = getR2Client()
    await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return `${PUBLIC_BASE}/${key}`
  } catch {
    return null
  }
}

export async function uploadAudio(key: string, audioBuffer: Buffer): Promise<string> {
  const client = getR2Client()
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: audioBuffer,
      ContentType: 'audio/mpeg',
      // WHY: Public read allows the client to stream audio directly from R2
      // without routing through the API server on every play.
      ACL: 'public-read',
    })
  )
  return `${PUBLIC_BASE}/${key}`
}
