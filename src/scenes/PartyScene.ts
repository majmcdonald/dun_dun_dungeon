import { PALETTE } from '../art/palette';
import type { PartyMember, Rarity } from '../combat/types';
import { ITEMS_BY_ID } from '../content/items';
import { SKILLS_BY_ID } from '../content/skills';
import { NATIVE_WIDTH } from '../engine/renderer';
import type { GameContext, Scene } from '../engine/scene';
import { drawBackground } from '../ui/background';
import { CHAR_ADVANCE, drawText, textWidth } from '../ui/font';
import { cardIconOrigin, drawEquipmentTooltip, drawPartyCard, hoveredSlot, partyCardRect } from '../ui/partyCard';
import { drawButton, drawFrame, inside, RARITY_COLOR, type Button, type Rect } from '../ui/widgets';
import { BattleScene } from './BattleScene';
import { LoadoutScene } from './LoadoutScene';
import { MapScene } from './MapScene';
import { RewardScene } from './RewardScene';

const START: Button = { x: 170, y: 212, w: 140, h: 22, label: 'START BATTLE' };
// With BACK showing, the two buttons sit side by side.
const START_BESIDE_BACK: Button = { ...START, x: 222 };
const BACK: Button = { x: 118, y: 212, w: 96, h: 22, label: 'BACK' };
const CARDS_TOP = 60;
const TITLE = 'UPDATE PARTY';
const HINT = 'DRAG CHARACTERS TO REORDER';

function editButton(card: Rect): Button {
  return { x: card.x + card.w - 34, y: card.y + 3, w: 30, h: 11, label: 'EDIT' };
}

interface Drag {
  from: number;
  grabX: number;
  grabY: number;
}

// The single place the party is changed between battles. Leaving it always starts the next fight.
export class PartyScene implements Scene {
  private drag: Drag | null = null;

  constructor(private game: GameContext) {}

  enter(): void {
    this.game.input.consumePresses();
    this.game.input.consumeClicks();
  }

  update(): void {
    const input = this.game.input;
    const pointer = input.pointer;

    for (const press of input.consumePresses()) {
      const index = this.game.state.party.findIndex((_, i) => inside(press, partyCardRect(i, CARDS_TOP)));
      if (index < 0) continue;
      const rect = partyCardRect(index, CARDS_TOP);
      if (inside(press, editButton(rect))) continue;
      this.drag = { from: index, grabX: press.x - rect.x, grabY: press.y - rect.y };
    }

    const clicks = input.consumeClicks();
    if (this.drag) {
      if (pointer.down) return;
      this.game.state.party = this.previewOrder();
      this.drag = null;
      return;
    }
    const newPicks = this.newPicks();
    for (const click of clicks) {
      if (newPicks && inside(click, BACK)) return this.game.scenes.switchTo(new RewardScene(this.game));
      if (inside(click, newPicks ? START_BESIDE_BACK : START)) {
        const toMap = this.game.state.run && !this.game.state.run.pending;
        return this.game.scenes.switchTo(toMap ? new MapScene(this.game) : new BattleScene(this.game));
      }
      const edit = this.game.state.party.findIndex((_, i) => inside(click, editButton(partyCardRect(i, CARDS_TOP))));
      if (edit >= 0) return this.game.scenes.switchTo(new LoadoutScene(this.game, edit));
    }
  }

  // Reward picks that can still be changed: shown as a note, with BACK to the reward screen.
  // As colored segments: each name in its rarity color.
  private newPicks(): [string, string][] | null {
    const run = this.game.state.run;
    const reward = run && !run.pending ? run.lastReward : null;
    if (!reward || (!reward.skill && !reward.item)) return null;
    const segments: [string, string][] = [['NEW: ', PALETTE.sand]];
    const add = (name: string, rarity: Rarity, kind: string) => {
      if (segments.length > 1) segments.push([', ', PALETTE.sand]);
      segments.push([name.toUpperCase(), RARITY_COLOR[rarity]], [` (${kind})`, PALETTE.lightGray]);
    };
    if (reward.skill) add(SKILLS_BY_ID[reward.skill].name, SKILLS_BY_ID[reward.skill].rarity, 'SKILL');
    if (reward.item) add(ITEMS_BY_ID[reward.item].name, ITEMS_BY_ID[reward.item].rarity, ITEMS_BY_ID[reward.item].slot.toUpperCase());
    return segments;
  }

  private dropIndex(): number {
    const pointerX = this.game.input.pointer.x;
    const count = this.game.state.party.length;
    for (let i = 0; i < count; i++) {
      const r = partyCardRect(i, CARDS_TOP);
      if (pointerX < r.x + r.w) return i;
    }
    return count - 1;
  }

  // The order the party would have if the dragged card were dropped right now.
  private previewOrder(): PartyMember[] {
    const party = [...this.game.state.party];
    if (!this.drag) return party;
    const [moved] = party.splice(this.drag.from, 1);
    party.splice(this.dropIndex(), 0, moved);
    return party;
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);
    drawText(ctx, TITLE, (NATIVE_WIDTH - textWidth(TITLE)) / 2, 16, PALETTE.sand);

    const pointer = this.game.input.pointer;
    const order = this.previewOrder();
    const dragged = this.drag ? this.game.state.party[this.drag.from] : null;

    order.forEach((m, i) => {
      const rect = partyCardRect(i, CARDS_TOP);
      if (m === dragged) {
        drawFrame(ctx, rect, PALETTE.slate);
        return;
      }
      drawPartyCard(ctx, m, i, rect, !this.drag && inside(pointer, rect) ? PALETTE.lightGray : PALETTE.darkSlate);
      if (!this.drag) drawButton(ctx, editButton(rect), inside(pointer, editButton(rect)));
    });

    const newPicks = this.newPicks();
    const start = newPicks ? START_BESIDE_BACK : START;
    if (newPicks) {
      let x = (NATIVE_WIDTH - textWidth(newPicks.map(([t]) => t).join(''))) / 2;
      for (const [text, color] of newPicks) {
        drawText(ctx, text, x, 182, color);
        x += text.length * CHAR_ADVANCE;
      }
      const hint = 'USE EDIT TO EQUIP. DRAG CARDS TO REORDER.';
      drawText(ctx, hint, (NATIVE_WIDTH - textWidth(hint)) / 2, 195, PALETTE.lightGray);
      drawButton(ctx, BACK, !this.drag && inside(pointer, BACK));
    } else drawText(ctx, HINT, (NATIVE_WIDTH - textWidth(HINT)) / 2, 190, PALETTE.lightGray);
    const label = this.game.state.run && !this.game.state.run.pending ? 'BACK TO MAP' : START.label;
    drawButton(ctx, { ...start, label }, !this.drag && inside(pointer, start));

    if (this.drag && dragged) {
      const base = partyCardRect(order.indexOf(dragged), CARDS_TOP);
      const rect = { ...base, x: pointer.x - this.drag.grabX, y: pointer.y - this.drag.grabY };
      drawPartyCard(ctx, dragged, order.indexOf(dragged), rect, PALETTE.gold);
      return;
    }

    this.game.state.party.forEach((m, i) => {
      const slot = hoveredSlot(pointer, cardIconOrigin(partyCardRect(i, CARDS_TOP)));
      if (slot) drawEquipmentTooltip(ctx, slot, m.equipment[slot], pointer);
    });
  }
}
