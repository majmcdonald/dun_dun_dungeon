import type { SkillDef } from '../../combat/types';
import { ally, barrier, buff, cls, debuff, delay, dmg, foe, haste, heal, regen, self, selfDamage, skill, slow, taunt, type SkillSpec } from '../build';

type Spec = Omit<SkillSpec, 'access' | 'category'> & { category?: SkillSpec['category'] };
const b = (spec: Spec): SkillDef => skill({ category: 'spell', ...spec, access: cls('bard') });

const sound = (extra: object = {}) => ({ type: 'magic', ...extra }) as const;

// Pace: speed the party up, slow the enemy down.
const pace: SkillDef[] = [
  b({ id: 'allegro', name: 'Allegro', theme: 'pace', rarity: 'common', cooldown: 8, target: ally('front', 'all'), fx: [haste(1, 4)], vfx: 'blessing' }),
  b({ id: 'lento', name: 'Lento', theme: 'pace', rarity: 'common', cooldown: 8, target: foe('front', 'all'), fx: [slow(1, 4)] }),
  b({ id: 'tempo', name: 'Tempo', theme: 'pace', rarity: 'common', cooldown: 5, target: ally('mostDamage'), fx: [haste(1, 4)] }),
  b({ id: 'staccato', name: 'Staccato', theme: 'pace', rarity: 'rare', cooldown: 5, target: foe('front', 'column'), fx: [slow(0.5, 3), dmg(0.5, sound())] }),
  b({ id: 'accelerando', name: 'Accelerando', theme: 'pace', rarity: 'rare', cooldown: 9, target: ally('front', 'all'), fx: [haste(1, 5)], synergy: { with: 'allegro', bonus: 0.3 }, vfx: 'blessing' }),
  b({ id: 'grandPause', name: 'Grand Pause', theme: 'pace', rarity: 'epic', cooldown: 10, target: foe('front', 'all'), fx: [delay(1)] }),
  b({ id: 'presto', name: 'Presto', theme: 'pace', rarity: 'legendary', cooldown: 10, target: ally('front', 'all'), fx: [haste(1, 5)], prerequisite: 'tempo', vfx: 'blessing' }),
];

// Inspiration: the bard slows himself to lift the whole party.
const inspiration: SkillDef[] = [
  b({ id: 'rousingSong', name: 'Rousing Song', theme: 'inspiration', rarity: 'common', cooldown: 8, target: ally('front', 'all'), fx: [buff('attack', 1.25, 5), self(slow(0.25, 5))], vfx: 'blessing' }),
  b({ id: 'hymnOfHealing', name: 'Hymn of Healing', theme: 'inspiration', rarity: 'common', cooldown: 8, target: ally('front', 'all'), fx: [regen(1.25, 5), self(slow(0.25, 5))], vfx: 'heal' }),
  b({ id: 'heroicBallad', name: 'Heroic Ballad', theme: 'inspiration', rarity: 'common', cooldown: 8, target: ally('front', 'all'), fx: [barrier(1.25, 4, 'resistance'), self(slow(0.25, 5))] }),
  b({ id: 'anthem', name: 'Anthem', theme: 'inspiration', rarity: 'rare', cooldown: 9, target: ally('front', 'all'), fx: [buff('defense', 0.55, 5), buff('resistance', 0.55, 5), self(slow(0.2, 5))], vfx: 'blessing' }),
  b({ id: 'muse', name: 'Muse', theme: 'inspiration', rarity: 'rare', cooldown: 7, target: ally('mostDamage'), fx: [buff('attack', 0.6, 5), buff('magic', 0.6, 5), self(slow(0.2, 4))], synergy: { with: 'rousingSong', bonus: 0.3 } }),
  b({ id: 'epicSaga', name: 'Epic Saga', theme: 'inspiration', rarity: 'epic', cooldown: 10, target: ally('front', 'all'), fx: [buff('attack', 0.6, 6), haste(0.6, 5), self(slow(0.2, 5))], vfx: 'blessing' }),
];

// Spirit: leads from the front, drawing danger onto himself to lift the party.
const spirit: SkillDef[] = [
  b({ id: 'standTall', name: 'Stand Tall', theme: 'spirit', rarity: 'common', cooldown: 7, target: ally('front', 'all'), fx: [buff('defense', 0.7, 5), self(taunt(0.3))] }),
  b({ id: 'leadTheCharge', name: 'Lead the Charge', theme: 'spirit', rarity: 'common', category: 'skill', cooldown: 3, target: foe('front'), fx: [dmg(1.2, { type: 'physical' }), self(debuff('defense', 0.2, 4))] }),
  b({ id: 'braveVerse', name: 'Brave Verse', theme: 'spirit', rarity: 'common', cooldown: 8, target: ally('front', 'all'), fx: [buff('attack', 1.2, 6), self(debuff('defense', 0.2, 5))], vfx: 'blessing' }),
  b({ id: 'spotlight', name: 'Spotlight', theme: 'spirit', rarity: 'rare', cooldown: 8, target: ally('front', 'all'), fx: [haste(0.7, 4), self(taunt(0.3))], synergy: { with: 'standTall', bonus: 0.3 } }),
  b({ id: 'martyrsSong', name: "Martyr's Song", theme: 'spirit', rarity: 'rare', cooldown: 7, target: ally('front', 'all'), fx: [heal(1.1), selfDamage(0.05)], vfx: 'heal' }),
  b({ id: 'unbreakableSpirit', name: 'Unbreakable Spirit', theme: 'spirit', rarity: 'epic', cooldown: 10, target: ally('front', 'all'), fx: [barrier(0.8, 5), self(taunt(0.2))] }),
  b({ id: 'swanSong', name: 'Swan Song', theme: 'spirit', rarity: 'legendary', cooldown: 10, trigger: { kind: 'onDefeat' }, target: ally('front', 'all'), fx: [heal(0.5), haste(0.5, 6)], prerequisite: 'discord', vfx: 'heal' }),
];

const general: SkillDef[] = [
  b({ id: 'mockingTune', name: 'Mocking Tune', theme: 'bard', rarity: 'common', cooldown: 4, target: foe('highestHp'), fx: [debuff('attack', 0.6, 4), dmg(0.4, sound())] }),
  b({ id: 'jingle', name: 'Jingle', theme: 'bard', rarity: 'common', cooldown: 3, target: foe('random'), fx: [dmg(1, sound({ hits: 2 }))] }),
  b({ id: 'echo', name: 'Echo', theme: 'bard', rarity: 'rare', cooldown: 4, target: foe('random', 'column'), fx: [dmg(1, sound({ element: 'lightning' }))] }),
  b({ id: 'counterpoint', name: 'Counterpoint', theme: 'bard', rarity: 'rare', cooldown: 4, target: foe('castSpell'), fx: [delay(0.5), dmg(0.5, sound())] }),
  b({ id: 'symphony', name: 'Symphony', theme: 'bard', rarity: 'epic', cooldown: 10, target: ally('front', 'all'), fx: [buff('attack', 0.4, 6), buff('defense', 0.3, 6), haste(0.3, 5)], vfx: 'blessing' }),
];

export const BARD_ARCHETYPES: SkillDef[] = [...pace, ...inspiration, ...spirit, ...general];
