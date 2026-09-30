import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { mkdirSync } from 'node:fs';
import { spritePixels, type SpriteDef } from '../../src/art/sprite';
// Usage: npx tsx tools/sprites/render-sprites.mts knight mage   (writes tools/out/knight-mage.png at 8x)
const OUT = new URL('../out', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const names = process.argv.slice(2);
const mods = await Promise.all(names.map((n) => import(`../../src/art/sprites/${n}.ts`)));
const defs: SpriteDef[] = mods.map((m) => Object.values(m)[0] as SpriteDef);
const SCALE = 8, BG = [0x5a, 0x3a, 0x2f];
const cells = defs.flatMap((d) => Object.keys(d.frames).map((f) => [d, f] as const));
const cw = 32 * SCALE + 16, W = cw * cells.length, H = 32 * SCALE + 16;
const rgb = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) rgb.set(BG, i * 3);
cells.forEach(([d, f], ci) => {
  const px = spritePixels(d, f);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const i = (y * 32 + x) * 4; if (px[i + 3] === 0) continue;
    for (let sy = 0; sy < SCALE; sy++) for (let sx = 0; sx < SCALE; sx++)
      rgb.set([px[i], px[i + 1], px[i + 2]], ((8 + y * SCALE + sy) * W + ci * cw + 8 + x * SCALE + sx) * 3);
  }
});
const t = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = t[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (ty: string, d: Buffer) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(ty), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 2;
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) rgb.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
writeFileSync(`${OUT}/${names.join('-')}.png`, Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
for (const d of defs) for (const [f, rows] of Object.entries(d.frames)) rows.forEach((r, y) => { if (r.length !== 32) console.log('BAD WIDTH', f, y, r.length); for (const ch of r) if (ch !== '.' && !(ch in d.legend)) console.log('BAD CHAR', f, y, ch); });
console.log('ok');
