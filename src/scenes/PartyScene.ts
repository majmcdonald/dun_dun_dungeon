import { PALETTE } from '../art/palette';
import type { PartyMember } from '../combat/types';
import { NATIVE_WIDTH } from '../engine/renderer';
import type { GameContext, Scene } from '../engine/scene';
import { drawBackground } from '../ui/background';
import { drawText, textWidth } from '../ui/font';
import { cardIconOrigin, drawEquipmentTooltip, drawPartyCard, hoveredSlot, partyCardRect } from '../ui/partyCard';
import { drawButton, drawFrame, inside, type Button, type Rect } from '../ui/widgets';
import { BattleScene } from './BattleScene';
import { LoadoutScene } from './LoadoutScene';

const START: Button = { x: 170, y: 212, w: 140, h: 22, label: 'START BATTLE' };
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
    for (const click of clicks) {
      if (inside(click, START)) return this.game.scenes.switchTo(new BattleScene(this.game));
      const edit = this.game.state.party.findIndex((_, i) => inside(click, editButton(partyCardRect(i, CARDS_TOP))));
      if (edit >= 0) return this.game.scenes.switchTo(new LoadoutScene(this.game, edit));
    }
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

    drawText(ctx, HINT, (NATIVE_WIDTH - textWidth(HINT)) / 2, 190, PALETTE.lightGray);
    drawButton(ctx, START, !this.drag && inside(pointer, START));

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
