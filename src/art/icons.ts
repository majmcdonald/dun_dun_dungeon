import type { EquipSlot } from '../combat/types';
import type { SpriteDef } from './sprite';

const legend: SpriteDef['legend'] = {
  K: 'black',
  W: 'white',
  L: 'lightGray',
  M: 'gray',
  B: 'brown',
  b: 'darkBrown',
  G: 'gold',
  C: 'cyan',
  Y: 'yellow',
  R: 'red',
  V: 'green',
  N: 'blue',
  P: 'magenta',
};

function icon(rows: string[]): SpriteDef {
  return { width: 8, height: 8, legend, frames: { idle: rows } };
}

export const EQUIP_ICONS: Record<EquipSlot, SpriteDef> = {
  helmet: icon(['..KKKK..', '.KLLMMK.', 'KLLMMMMK', 'KMKKKKMK', 'KMMMMMMK', 'KMK..KMK', 'KKK..KKK', '........']),
  armor: icon(['KK....KK', 'KMK..KMK', 'KMMKKMMK', 'KLMMMMMK', 'KLMMMMMK', '.KLMMMK.', '.KMMMMK.', '.KKKKKK.']),
  boots: icon(['........', '.KKK....', '.KBK....', '.KBK....', '.KBBKK..', '.KBBBBK.', '.KbbbbK.', '.KKKKKK.']),
  weapon: icon(['......KK', '.....KWK', '....KWLK', '.K.KWLK.', '.KGKLK..', '..KGK...', '.KBKGK..', 'KBK.K...']),
  jewelry: icon(['...KK...', '..KCCK..', '..KKKK..', '.KGKKGK.', 'KGK..KGK', 'KGK..KGK', '.KGKKGK.', '..KKKK..']),
};

export const BUFF_ICON = icon(['...K....', '..KYK...', '.KYYYK..', 'KKYYYKK.', '..KYK...', '..KYK...', '..KKK...', '........']);
export const DEBUFF_ICON = icon(['..KKK...', '..KRK...', '..KRK...', 'KKRRRKK.', '.KRRRK..', '..KRK...', '...K....', '........']);
export const HASTE_ICON = icon(['KK.KK...', 'KVKKVK..', '.KVKKVK.', '..KVKKVK', '.KVKKVK.', 'KVKKVK..', 'KK.KK...', '........']);
export const SLOW_ICON = icon(['...KK.KK', '..KNKKNK', '.KNKKNK.', 'KNKKNK..', '.KNKKNK.', '..KNKKNK', '...KK.KK', '........']);
export const TAUNT_ICON = icon(['KKKKKKK.', 'KRRWRRK.', 'KRRWRRK.', 'KRRWRRK.', 'KRRRRRK.', '.KRWRK..', '..KRK...', '...K....']);
export const SHAPESHIFT_ICON = icon(['.KK.KK..', 'KBBKBBK.', '.KKKKK..', 'KBBBBBK.', 'KBBBBBK.', '.KBBBK..', '..KKK...', '........']);
export const DOT_ICON = icon(['...K....', '..KPK...', '..KPK...', '.KPPPK..', 'KPPPPPK.', 'KPPPPPK.', '.KPPPK..', '..KKK...']);
export const REGEN_ICON = icon(['..KKK...', '..KVK...', 'KKKVKKK.', 'KVVVVVK.', 'KKKVKKK.', '..KVK...', '..KKK...', '........']);
