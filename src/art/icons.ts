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
