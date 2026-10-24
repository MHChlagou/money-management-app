// Generates PNG app icons without any native image library (pure Node: zlib + CRC32).
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function png(size, paint) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      // 4x4 supersampling so curved edges come out antialiased.
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) {
        const [pr, pg, pb, pa] = paint((x + (sx + 0.5) / 4) / size, (y + (sy + 0.5) / 4) / size)
        r += pr * pa; g += pg * pa; b += pb * pa; a += pa
      }
      if (a > 0) { r /= a; g /= a; b /= a }
      const i = y * (size * 4 + 1) + 1 + x * 4
      raw[i] = Math.round(r); raw[i + 1] = Math.round(g); raw[i + 2] = Math.round(b); raw[i + 3] = Math.round(a / 16)
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ])
}

const inRoundedRect = (u, v, x, y, w, h, r) => {
  const cx = Math.max(x + r, Math.min(u, x + w - r))
  const cy = Math.max(y + r, Math.min(v, y + h - r))
  return (u - cx) ** 2 + (v - cy) ** 2 <= r * r
}

// Design: a coin minted in lume green with a milled edge and an engraved R on a midnight tile, matching
// public/favicon-v2.svg (drawn on a 64-unit grid).
const NIGHT = [12, 22, 36, 255], RIDGE = [93, 143, 28, 255], RING = [93, 143, 28, 255]
const near = (x, y, [px, py], r) => (x - px) ** 2 + (y - py) ** 2 <= r * r
const onSegment = (x, y, [ax, ay], [bx, by], w) => {
  const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)))
  return near(x, y, [ax + t * (bx - ax), ay + t * (by - ay)], w)
}
const lerp = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k))
// The coin's shine: the SVG's radial gradient (centre 38% / 32% of the coin's box, radius 80%).
const shine = (x, y) => {
  const t = Math.min(1, Math.hypot(x - 26.84, y - 24.26) / 34.4)
  return t < 0.55 ? lerp([239, 252, 201, 255], [195, 245, 122, 255], t / 0.55) : lerp([195, 245, 122, 255], [127, 181, 42, 255], (t - 0.55) / 0.45)
}
const RIDGES = Array.from({ length: 48 }, (_, i) => {
  const a = (i * 7.5 * Math.PI) / 180
  return [[32 + 19.4 * Math.sin(a), 32 - 19.4 * Math.cos(a)], [32 + 21.5 * Math.sin(a), 32 - 21.5 * Math.cos(a)]]
})
// The engraved R: stem, top and bottom of the bowl, the bowl's curve, and the leg. Stroke width 3.8.
const inR = (x, y) => {
  const w = 1.9
  if (onSegment(x, y, [26.5, 41.5], [26.5, 22.5], w) || onSegment(x, y, [26.5, 22.5], [32.7, 22.5], w) || onSegment(x, y, [26.5, 33.3], [32.7, 33.3], w)) return true
  if (x >= 32.7 && Math.abs(Math.hypot(x - 32.7, y - 27.9) - 5.4) <= w) return true
  return onSegment(x, y, [32.4, 33.3], [37.8, 41.5], w)
}

const paint = (fullBleed) => (u, v) => {
  if (!fullBleed && !inRoundedRect(u, v, 0, 0, 1, 1, 15 / 64)) return [0, 0, 0, 0]
  const x = u * 64, y = v * 64
  const d = Math.hypot(x - 32, y - 32)
  if (d > 21.5) return near(x, y, [32, 33.5], 21.5) ? lerp(NIGHT, [0, 0, 0, 255], 0.5) : NIGHT
  if (inR(x, y)) return NIGHT
  if (Math.abs(d - 16) <= 0.6) return RING
  if (d >= 19.4 && RIDGES.some(([a, b]) => onSegment(x, y, a, b, 0.55))) return RIDGE
  return shine(x, y)
}

writeFileSync('public/icon-v2-192.png', png(192, paint(false)))
writeFileSync('public/icon-v2-512.png', png(512, paint(true)))
writeFileSync('public/apple-touch-icon-v2.png', png(180, paint(true)))
console.log('icons written')
