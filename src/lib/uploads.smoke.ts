// Minimal smoke test for the upload optimizer. Run with: npx tsx src/lib/uploads.smoke.ts
import assert from 'node:assert/strict'
import { unlink, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { saveImageUpload, saveMediaUpload, UploadError } from './uploads'

const MAX_BYTES = 5 * 1024 * 1024

// Deterministic pseudo-noise (a seeded LCG, not Math.random) so the test is reproducible; high-entropy
// noise defeats PNG's delta filtering, reliably producing a >5MB file to exercise the optimizer.
function noisePng(width: number, height: number): Promise<Buffer> {
  const raw = Buffer.alloc(width * height * 3)
  let seed = 42
  for (let i = 0; i < raw.length; i++) {
    // Math.imul keeps this a true 32-bit multiply; plain `*` loses precision above 2^53 and
    // degenerates into a low-entropy (highly PNG-compressible) sequence.
    seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff
    raw[i] = (seed >> 8) & 0xff
  }
  return sharp(raw, { raw: { width, height, channels: 3 } }).png().toBuffer()
}

function toFile(buffer: Buffer, name: string, type: string): File {
  return new File([new Uint8Array(buffer)], name, { type })
}

async function cleanup(url: string) {
  await unlink(path.join(process.cwd(), 'public', url)).catch(() => {})
}

async function main() {
  // 1. Small image passes through untouched (no unnecessary re-encoding).
  const small = await sharp({ create: { width: 200, height: 150, channels: 3, background: 'red' } })
    .jpeg()
    .toBuffer()
  assert.ok(small.length < MAX_BYTES, 'fixture should start under the limit')
  const smallUrl = await saveImageUpload(toFile(small, 'small.jpg', 'image/jpeg'), { prefix: 'smoketest' })
  const smallOnDisk = await stat(path.join(process.cwd(), 'public', smallUrl))
  assert.equal(smallOnDisk.size, small.length, 'small image should be written byte-for-byte unchanged')
  await cleanup(smallUrl)
  console.log('PASS: small image left untouched')

  // 2. A photo comfortably under the hard limit but at camera resolution still gets capped to
  // display size. This is the case that made pages slow: 11MP files rendered into 224px thumbnails.
  const camera = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: 'blue' } })
    .jpeg()
    .toBuffer()
  assert.ok(camera.length < MAX_BYTES, 'fixture should start under the hard limit')
  const cameraUrl = await saveImageUpload(toFile(camera, 'camera.jpg', 'image/jpeg'), { prefix: 'smoketest' })
  const cameraMeta = await sharp(await readFile(path.join(process.cwd(), 'public', cameraUrl))).metadata()
  assert.equal(cameraMeta.width, 1920, 'long edge should be capped at 1920px')
  assert.equal(cameraMeta.height, 1280, 'aspect ratio should be preserved')
  await cleanup(cameraUrl)
  console.log(`PASS: 3000x2000 capped to ${cameraMeta.width}x${cameraMeta.height}`)

  // 3. Transparency survives normalization — JPEG has no alpha channel, so a transparent PNG
  // must stay a PNG instead of flattening to black.
  const alpha = await sharp({
    create: { width: 2400, height: 2400, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .png()
    .toBuffer()
  const alphaUrl = await saveImageUpload(toFile(alpha, 'logo.png', 'image/png'), { prefix: 'smoketest' })
  assert.ok(alphaUrl.endsWith('.png'), `transparent image should stay PNG (got ${alphaUrl})`)
  const alphaMeta = await sharp(await readFile(path.join(process.cwd(), 'public', alphaUrl))).metadata()
  assert.equal(alphaMeta.hasAlpha, true, 'alpha channel should survive the resize')
  assert.equal(alphaMeta.width, 1920, 'transparent image should still be capped')
  await cleanup(alphaUrl)
  console.log('PASS: transparent PNG stayed PNG with alpha intact')

  // 4. Oversized image gets auto-optimized under the limit and stays a valid, readable image.
  const big = await noisePng(1600, 1600)
  assert.ok(big.length > MAX_BYTES, `fixture should start over the limit (got ${big.length} bytes)`)
  const bigUrl = await saveImageUpload(toFile(big, 'big.png', 'image/png'), { prefix: 'smoketest' })
  const bigPath = path.join(process.cwd(), 'public', bigUrl)
  const optimizedBytes = await readFile(bigPath)
  assert.ok(optimizedBytes.length <= MAX_BYTES, `optimized image should be <= 5MB (got ${optimizedBytes.length} bytes)`)
  const metadata = await sharp(optimizedBytes).metadata()
  assert.ok(metadata.width && metadata.width > 0, 'optimized output should still decode as a valid image')
  await cleanup(bigUrl)
  console.log(`PASS: ${big.length} bytes -> ${optimizedBytes.length} bytes, still valid (${metadata.width}x${metadata.height})`)

  // 5. Oversized video is rejected, not silently re-encoded (images-only scope).
  const fakeVideo = toFile(Buffer.alloc(60 * 1024 * 1024), 'clip.mp4', 'video/mp4')
  await assert.rejects(
    () => saveMediaUpload(fakeVideo, { prefix: 'smoketest' }),
    (e: unknown) => e instanceof UploadError && /50MB/.test(e.message),
    'oversized video should be rejected with a size error, not optimized'
  )
  console.log('PASS: oversized video still rejected (video optimization out of scope)')

  // 6. Invalid file type is rejected.
  await assert.rejects(
    () => saveImageUpload(toFile(Buffer.from('not an image'), 'x.txt', 'text/plain'), { prefix: 'smoketest' }),
    (e: unknown) => e instanceof UploadError,
    'non-image type should be rejected'
  )
  console.log('PASS: invalid file type rejected')

  console.log('\nAll smoke tests passed.')
}

main().catch((err) => {
  console.error('SMOKE TEST FAILED:', err)
  process.exit(1)
})
