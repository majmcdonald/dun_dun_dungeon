import { PALETTE } from './art/palette';
import { spriteCanvas, type SpriteDef } from './art/sprite';
import { SLIME_SPRITE } from './art/sprites/slime';
import { KNIGHT_SPRITE } from './art/sprites/knight';
import { startLoop } from './engine/loop';
import { Renderer } from './engine/renderer';

// Dev-only page for reviewing art at true in-game scale before approval.

const renderer = new Renderer(document.getElementById('game') as HTMLCanvasElement);
const ctx = renderer.ctx;

function frames(def: SpriteDef): Record<string, HTMLCanvasElement> {
  return Object.fromEntries(Object.keys(def.frames).map((f) => [f, spriteCanvas(def, f)]));
}

const knight = frames(KNIGHT_SPRITE);
const slime = frames(SLIME_SPRITE);

const ATTACK_EVERY = 1.5;
const ATTACK_LENGTH = 0.3;
let elapsed = 0;

function label(text: string, x: number, y: number): void {
  ctx.fillStyle = PALETTE.lightGray;
  ctx.font = '8px monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
}

function drawScaled(img: HTMLCanvasElement, x: number, y: number, scale: number): void {
  ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
}

startLoop({
  update: (dt) => {
    elapsed += dt;
  },
  render: () => {
    renderer.clear(PALETTE.night);

    label('ART PREVIEW - Endesga 32', 8, 6);

    label('frames x3', 8, 24);
    drawScaled(knight.idle, 8, 36, 3);
    drawScaled(knight.attack, 112, 36, 3);
    drawScaled(slime.idle, 232, 36, 3);
    drawScaled(slime.attack, 336, 36, 3);
    label('knight idle', 8, 134);
    label('knight attack', 112, 134);
    label('slime idle', 232, 134);
    label('slime attack', 336, 134);

    // Attack animation at true 1x game size: swap to attack frame and lunge toward the target.
    label('in-game size, animated', 8, 158);
    const phase = elapsed % ATTACK_EVERY;
    const knightAttacking = phase < ATTACK_LENGTH;
    const slimeAttacking = phase >= ATTACK_EVERY / 2 && phase < ATTACK_EVERY / 2 + ATTACK_LENGTH;
    const lunge = (t: number) => Math.round(Math.sin((t / ATTACK_LENGTH) * Math.PI) * 6);

    ctx.fillStyle = PALETTE.darkSlate;
    ctx.fillRect(0, 214, 480, 56);
    ctx.drawImage(knightAttacking ? knight.attack : knight.idle, 150 + (knightAttacking ? lunge(phase) : 0), 184);
    ctx.drawImage(
      slimeAttacking ? slime.attack : slime.idle,
      290 - (slimeAttacking ? lunge(phase - ATTACK_EVERY / 2) : 0),
      184,
    );

    const swatch = 8;
    Object.values(PALETTE).forEach((hex, i) => {
      ctx.fillStyle = hex;
      ctx.fillRect(8 + (i % 16) * swatch, 232 + Math.floor(i / 16) * swatch, swatch, swatch);
    });
  },
});
