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
      const [r, g, b, a] = paint(x / size, y / size)
      const i = y * (size * 4 + 1) + 1 + x * 4
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = a
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

// Design: teal rounded square (or full bleed for maskable) with three rising bars.
const paint = (fullBleed) => (u, v) => {
  const bg = [15, 118, 110, 255]
  if (!fullBleed && !inRoundedRect(u, v, 0, 0, 1, 1, 0.22)) return [0, 0, 0, 0]
  const bars = [[0.22, 0.53, 0.12, 0.25, [204, 251, 241]], [0.44, 0.38, 0.12, 0.40, [204, 251, 241]], [0.66, 0.22, 0.12, 0.56, [94, 234, 212]]]
  for (const [x, y, w, h, c] of bars) if (inRoundedRect(u, v, x, y, w, h, 0.03)) return [...c, 255]
  return bg
}

writeFileSync('public/pwa-192x192.png', png(192, paint(false)))
writeFileSync('public/pwa-512x512.png', png(512, paint(true)))
writeFileSync('public/apple-touch-icon.png', png(180, paint(true)))
console.log('icons written')
