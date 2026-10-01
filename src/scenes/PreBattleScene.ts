import { PALETTE } from '../art/palette';
import { spriteCanvas } from '../art/sprite';
import { SPRITES } from '../art/sprites';
import { MAP_ENCOUNTER } from '../content/enemies';
import type { CombatantDef } from '../combat/types';
import { NATIVE_WIDTH } from '../engine/renderer';
import type { GameContext, Scene } from '../engine/scene';
import { drawBackground } from '../ui/background';
import { drawText, textWidth } from '../ui/font';
import { cardIconOrigin, drawEquipmentTooltip, drawPartyCard, hoveredSlot, partyCardRect } from '../ui/partyCard';
import { drawButton, drawPanel, inside, type Button, type Rect } from '../ui/widgets';
import { pendingNode } from '../run/flow';
import { BattleScene } from './BattleScene';
import { PartyScene } from './PartyScene';

const UPDATE: Button = { x: 106, y: 228, w: 128, h: 22, label: 'UPDATE PARTY' };
const FIGHT: Button = { x: 246, y: 228, w: 128, h: 22, label: 'FIGHT' };
const TITLE = 'PREPARE FOR BATTLE';
const NODE_TITLE: Partial<Record<string, string>> = { epic: 'EPIC MONSTER AHEAD', boss: 'BOSS FIGHT' };
const ENEMY_PANEL: Rect = { x: 10, y: 44, w: 460, h: 56 };
const ENEMY_CHIP_W = 64;
const CARDS_TOP = 106;

export class PreBattleScene implements Scene {
  // Each enemy type once, in order of first appearance: the player learns what, not how many.
  private enemyTypes: { def: CombatantDef; sprite: HTMLCanvasElement }[] = [
    ...new Map(MAP_ENCOUNTER.map((d) => [d.id, d])).values(),
  ].map((def) => ({ def, sprite: spriteCanvas(SPRITES[def.id], 'idle') }));

  constructor(private game: GameContext) {}

  enter(): void {
    this.game.input.consumeKeys();
  }

  update(): void {
    for (const click of this.game.input.consumeClicks()) {
      if (inside(click, FIGHT)) return this.game.scenes.switchTo(new BattleScene(this.game));
      if (inside(click, UPDATE)) return this.game.scenes.switchTo(new PartyScene(this.game));
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);
    const title = NODE_TITLE[pendingNode(this.game)?.type ?? ''] ?? TITLE;
    drawText(ctx, title, (NATIVE_WIDTH - textWidth(title)) / 2, 16, PALETTE.sand);
    this.drawEnemies(ctx);

    const party = this.game.state.party;
    party.forEach((m, i) => drawPartyCard(ctx, m, i, partyCardRect(i, CARDS_TOP), PALETTE.darkSlate));

    const pointer = this.game.input.pointer;
    drawButton(ctx, UPDATE, inside(pointer, UPDATE));
    drawButton(ctx, FIGHT, inside(pointer, FIGHT));

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
