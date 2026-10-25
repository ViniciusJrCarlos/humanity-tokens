// Gera os ícones do PWA a partir da arte enviada (assets/brand/app-icon.jpg).
import sharp from 'sharp'
const SRC = 'assets/brand/app-icon.jpg'
const BG = { r: 191, g: 224, b: 248, alpha: 1 }
const meta = await sharp(SRC).metadata()
const k = meta.width / 687 // coordenadas medidas na arte em 687px de largura
const base = () => sharp(SRC).extract({ left: Math.round(15 * k), top: Math.round(165 * k), width: Math.round(657 * k), height: Math.round(720 * k) })
async function icon(size, file, pad = 0) {
  const inner = Math.round(size * (1 - pad * 2))
  const img = await sharp(await base().png().toBuffer()).resize(inner, inner, { fit: 'contain', background: BG }).toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: img, gravity: 'center' }]).png().toFile(`public/${file}`)
}
await icon(192, 'pwa-192x192.png')
await icon(512, 'pwa-512x512.png')
await icon(512, 'maskable-512x512.png', 0.1)
await icon(180, 'apple-touch-icon.png')
await icon(64, 'favicon.png')
await icon(32, 'favicon-32.png')
console.log('ícones gerados')
