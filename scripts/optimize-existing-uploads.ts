/**
 * One-off backfill: caps images already sitting in public/uploads at display resolution.
 *
 * New uploads are normalized by src/lib/uploads.ts, but everything uploaded before that was stored
 * at full camera resolution (measured on prod: 2731x4096, 1.5MB each). Nothing downstream resizes
 * them because `images.unoptimized: true`, so they stay slow until rewritten on disk.
 *
 *   npx tsx scripts/optimize-existing-uploads.ts           # dry run, reports what it would save
 *   npx tsx scripts/optimize-existing-uploads.ts --apply    # actually rewrites the files
 *
 * Rewrites are in place and NOT reversible — keep your originals. Each file is written to a temp
 * name and renamed over the original, so nginx never serves a half-written image.
 */
import { readdir, readFile, writeFile, rename, stat, unlink } from 'node:fs/promises'
import path from 'node:path'
import sharp, { type Sharp } from 'sharp'

const MAX_EDGE = 1920
const TARGET_BYTES = 500 * 1024
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

// Animated GIFs would lose their frames, and videos aren't ours to transcode.
const REWRITABLE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp'])

function mb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/** Re-encodes in the *same* format so the URL's extension and the served Content-Type stay honest. */
function encode(pipeline: Sharp, format: string): Sharp {
  if (format === 'png') return pipeline.png({ compressionLevel: 9 })
  if (format === 'webp') return pipeline.webp({ quality: 80 })
  return pipeline.jpeg({ quality: 80, mozjpeg: true })
}

async function main() {
  const apply = process.argv.includes('--apply')

  let files: string[]
  try {
    files = await readdir(UPLOADS_DIR)
  } catch (err) {
    console.error(`[backfill] cannot read ${UPLOADS_DIR}:`, err)
    process.exit(1)
  }

  const candidates = files.filter((f) => REWRITABLE_EXT.has(path.extname(f).toLowerCase()))
  console.log(`[backfill] ${files.length} files in uploads, ${candidates.length} rewritable images`)
  console.log(apply ? '[backfill] APPLY mode — files will be overwritten\n' : '[backfill] DRY RUN — nothing will be written\n')

  let rewritten = 0
  let skipped = 0
  let failed = 0
  let before = 0
  let after = 0

  for (const name of candidates) {
    const filePath = path.join(UPLOADS_DIR, name)
    try {
      const original = await readFile(filePath)
      const metadata = await sharp(original).metadata()
      const longEdge = Math.max(metadata.width ?? 0, metadata.height ?? 0)

      if (longEdge <= MAX_EDGE && original.length <= TARGET_BYTES) {
        skipped++
        continue
      }

      // .rotate() is required, not optional: sharp strips EXIF on output, so without baking the
      // orientation in first, any photo that relied on an EXIF orientation tag would come out sideways.
      const output = await encode(
        sharp(original)
          .rotate()
          .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true }),
        metadata.format ?? 'jpeg'
      ).toBuffer()

      if (output.length >= original.length) {
        console.log(`  skip  ${name} — re-encode is no smaller (${mb(original.length)})`)
        skipped++
        continue
      }

      const newMeta = await sharp(output).metadata()
      console.log(
        `  ${apply ? 'write' : 'would'} ${name}  ${metadata.width}x${metadata.height} ${mb(original.length)}` +
          ` -> ${newMeta.width}x${newMeta.height} ${mb(output.length)}`
      )

      if (apply) {
        const tmp = `${filePath}.tmp`
        await writeFile(tmp, output)
        await rename(tmp, filePath).catch(async (err) => {
          await unlink(tmp).catch(() => {})
          throw err
        })
      }

      rewritten++
      before += original.length
      after += output.length
    } catch (err) {
      // Keep going: one unreadable file shouldn't abandon the rest of the backfill.
      console.error(`  FAIL  ${name}:`, err instanceof Error ? err.message : err)
      failed++
    }
  }

  const saved = before - after
  console.log(`\n[backfill] ${rewritten} rewritten, ${skipped} already fine, ${failed} failed`)
  if (rewritten > 0) {
    console.log(`[backfill] ${mb(before)} -> ${mb(after)} (saves ${mb(saved)}, ${Math.round((saved / before) * 100)}%)`)
  }
  if (!apply && rewritten > 0) {
    console.log('[backfill] re-run with --apply to write these changes')
  }
  // A failed file means an image is unreadable and still slow — surface it to the caller.
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('[backfill] failed:', err)
  process.exit(1)
})
