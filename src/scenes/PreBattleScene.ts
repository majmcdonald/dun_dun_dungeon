import { PALETTE } from '../art/palette';
import { spriteCanvas } from '../art/sprite';
import { SPRITES } from '../art/sprites';
import { TEST_ENCOUNTER } from '../combat/data';
import type { CombatantDef } from '../combat/types';
import { NATIVE_WIDTH } from '../engine/renderer';
import type { GameContext, Scene } from '../engine/scene';
import { createState } from '../game/state';
import { drawBackground } from '../ui/background';
import { drawText, textWidth } from '../ui/font';
import { cardIconOrigin, drawEquipmentTooltip, drawPartyCard, hoveredSlot, partyCardRect } from '../ui/partyCard';
import { drawButton, drawPanel, inside, type Button, type Rect } from '../ui/widgets';
import { BattleScene } from './BattleScene';
import { PartyScene } from './PartyScene';

const UPDATE: Button = { x: 106, y: 228, w: 128, h: 22, label: 'UPDATE PARTY' };
const FIGHT: Button = { x: 246, y: 228, w: 128, h: 22, label: 'FIGHT' };
const TITLE = 'PREPARE FOR BATTLE';
const ENEMY_PANEL: Rect = { x: 10, y: 44, w: 460, h: 56 };
const ENEMY_CHIP_W = 64;
const CARDS_TOP = 106;

export class PreBattleScene implements Scene {
  // Each enemy type once, in order of first appearance: the player learns what, not how many.
  private enemyTypes: { def: CombatantDef; sprite: HTMLCanvasElement }[] = [
    ...new Map(TEST_ENCOUNTER.map((d) => [d.id, d])).values(),
  ].map((def) => ({ def, sprite: spriteCanvas(SPRITES[def.id], 'idle') }));

  constructor(private game: GameContext) {}

  enter(): void {
    this.game.input.consumeKeys();
  }

  update(): void {
    if (this.game.input.consumeKeys().has('KeyR')) this.game.state.party = createState().party;
    for (const click of this.game.input.consumeClicks()) {
      if (inside(click, FIGHT)) return this.game.scenes.switchTo(new BattleScene(this.game));
      if (inside(click, UPDATE)) return this.game.scenes.switchTo(new PartyScene(this.game));
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);
    drawText(ctx, TITLE, (NATIVE_WIDTH - textWidth(TITLE)) / 2, 16, PALETTE.sand);
    this.drawEnemies(ctx);

    const party = this.game.state.party;
    party.forEach((m, i) => drawPartyCard(ctx, m, i, partyCardRect(i, CARDS_TOP), PALETTE.darkSlate));

    const pointer = this.game.input.pointer;
    drawButton(ctx, UPDATE, inside(pointer, UPDATE));
    drawButton(ctx, FIGHT, inside(pointer, FIGHT));
    drawText(ctx, 'R: RESET TEST GEAR', 8, 258, PALETTE.slate, null);

    party.forEach((m, i) => {
      const origin = cardIconOrigin(partyCardRect(i, CARDS_TOP));
      const slot = hoveredSlot(pointer, origin);
      if (slot) drawEquipmentTooltip(ctx, slot, m.equipment[slot], pointer);
    });
  }

  private drawEnemies(ctx: CanvasRenderingContext2D): void {
    drawPanel(ctx, ENEMY_PANEL, PALETTE.darkSlate);
    const label = 'YOU WILL FACE';
    drawText(ctx, label, ENEMY_PANEL.x + (ENEMY_PANEL.w - textWidth(label)) / 2, ENEMY_PANEL.y + 4, PALETTE.hotRed);
    const left = ENEMY_PANEL.x + (ENEMY_PANEL.w - this.enemyTypes.length * ENEMY_CHIP_W) / 2;
    this.enemyTypes.forEach(({ def, sprite }, i) => {
      const cx = left + i * ENEMY_CHIP_W + ENEMY_CHIP_W / 2;
      ctx.drawImage(sprite, cx - 16, ENEMY_PANEL.y + 10);
      drawText(ctx, def.name, cx - textWidth(def.name) / 2, ENEMY_PANEL.y + 44, PALETTE.lightGray);
    });
  }
}
