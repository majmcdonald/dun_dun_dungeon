"""Hand-authored class sprites. Each body row is written explicitly (outlines included) and placed by column;
held items are drawn once as stamps so they stay identical between the idle and attack frames.

Usage: python3 tools/sprites/hand.py rogue monk ...   (writes src/art/sprites/<name>.ts)
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from paint import Grid, emit  # noqa: E402

OUT = str(Path(__file__).resolve().parents[2] / 'src' / 'art' / 'sprites')


def draw(rows):
    """rows: {y: [(x, 'segment'), ...]} — segments are explicit pixels; spaces are skipped."""
    g = Grid()
    for y, segs in rows.items():
        for x, s in segs:
            g.put(x, y, s)
    return g


# ------------------------------------------------------------------ Rogue
ROGUE_HEAD = {
    3: [(11, 'KKKK')],
    4: [(10, 'KAHHHKK')],
    5: [(10, 'KAHHHHHK')],
    6: [(10, 'KAHHNNNHK')],
    7: [(10, 'KAHNSKSSK')],
    8: [(10, 'KAHNsSSSSK')],
    9: [(10, 'KAHNRRrrK')],
    10: [(10, 'KAHHRrrK')],
    11: [(11, 'KHHNNK')],
    12: [(8, 'KRRrrrrrK')],
}
ROGUE_BODY = {
    13: [(5, 'KRr'), (8, 'KTTBBBBBBbbK')],
    14: [(5, 'KK'), (8, 'KbBBBBBBbdBbK')],
    15: [(8, 'KTbBBBBbddBbK')],
    16: [(8, 'KTBbbBBbddBbK')],
    17: [(8, 'KTBBBGbbddBbK')],
    18: [(8, 'KTBBBBBbddSsK')],
    19: [(9, 'KbbbGbbddSsK')],
    20: [(9, 'KTBBBBbddKK')],
    21: [(9, 'KBBBBbdddK')],
    22: [(9, 'KbbbbddddK')],
    23: [(10, 'KHNKKHNK')],
    24: [(10, 'KHNKKHNK')],
    25: [(10, 'KANKKANK')],
    26: [(10, 'KHNKKHNK')],
    27: [(10, 'KBbKKBbK')],
    28: [(10, 'KBbKKBbK')],
    29: [(10, 'KBBbKBBbK')],
    30: [(10, 'KKKKKKKKK')],
}


def rogue():
    idle = draw({**ROGUE_HEAD, **ROGUE_BODY})
    # Reverse-grip dagger hanging from the hand: gold guard, 4px blade pointing down.
    idle.put(17, 20, 'KGGGK')
    for y in range(21, 25):
        idle.put(18, y, 'KWK' if y < 23 else 'KLK')
    idle.put(19, 25, 'K')

    atk = draw({**ROGUE_HEAD, **ROGUE_BODY})
    # Arm thrust forward along rows 15-16; the same 4px blade now points ahead.
    atk.clear(18, 13, 31, 22)
    atk.put(18, 13, 'bK')
    atk.put(18, 14, 'BbKKKKKK')
    atk.put(18, 15, 'BBBbSSGWWWLK')
    atk.put(18, 16, 'bbbbssGKKKKK')
    atk.put(18, 17, 'KKKKKKK')
    atk.put(17, 18, 'dK')
    atk.put(17, 19, 'dK')
    atk.put(16, 20, 'dK')
    atk.put(16, 21, 'dK')
    atk.put(17, 22, 'K')
    emit(f'{OUT}/rogue.ts', 'ROGUE_SPRITE',
         {'K': 'black', 'A': 'slate', 'H': 'darkSlate', 'N': 'night', 'S': 'skin', 's': 'skinShade', 'R': 'red',
          'r': 'darkRed', 'T': 'tan', 'B': 'brown', 'b': 'darkBrown', 'd': 'deepBrown', 'G': 'gold', 'W': 'white',
          'L': 'lightGray'},
         {'idle': idle, 'attack': atk})


# ------------------------------------------------------------------ Monk
MONK_HEAD = {
    2: [(11, 'KK')],
    3: [(10, 'KbdK')],
    4: [(10, 'KdKKKKKKK')],
    5: [(11, 'KEESSSSsK')],
    6: [(11, 'KESSSSSsK')],
    7: [(11, 'KSsSSKSSK')],
    8: [(11, 'KSsSSSSSSK')],
    9: [(11, 'KSSSSSsSK')],
    10: [(11, 'KsSSSSSsK')],
    11: [(12, 'KsSSsK')],
    12: [(9, 'KKKKKssKK')],
}
MONK_BODY = {
    13: [(8, 'KYOEssOORRK')],
    14: [(8, 'KYOOEsOORr')],
    15: [(8, 'KYOOOEOORr')],
    16: [(7, 'KEeOOOOEORr')],
    17: [(7, 'KeeOOOOORRr')],
    18: [(7, 'KKKOOOORRrr')],
    19: [(9, 'KbbbbbbddK')],
    20: [(9, 'KYOOORRbrK')],
    21: [(9, 'KYOORRrbrK')],
    22: [(9, 'KOORRrrrrK')],
    23: [(10, 'KORKKORK')],
    24: [(10, 'KORKKORK')],
    25: [(10, 'KYRKKYRK')],
    26: [(10, 'KOrKKOrK')],
    27: [(10, 'KEeKKEeK')],
    28: [(10, 'KSsKKSsK')],
    29: [(10, 'KSSsKSSsK')],
    30: [(10, 'KKKKKKKKK')],
}


def monk():
    idle = draw({**MONK_HEAD, **MONK_BODY})
    # Guard: forearm rises from the elbow to a wrapped fist held in front of the chin.
    idle.put(18, 13, 'KKK')
    idle.put(18, 14, 'EEeK')
    idle.put(18, 15, 'EeeK')
    idle.put(18, 16, 'eeeK')
    idle.put(18, 17, 'SsK')
    idle.put(18, 18, 'SsK')
    idle.put(18, 19, 'KK')

    atk = draw({**MONK_HEAD, **MONK_BODY})
    # Straight punch: the same 3x3 fist at the end of a fully extended arm.
    atk.put(18, 13, 'KKKKKKKKK')
    atk.put(18, 14, 'SSSSSEEeK')
    atk.put(18, 15, 'ssssSEeeK')
    atk.put(18, 16, 'KKKKKeeeK')
    atk.put(18, 17, 'K    KKK')
    atk.put(18, 18, 'K')
    emit(f'{OUT}/monk.ts', 'MONK_SPRITE',
         {'K': 'black', 'E': 'sand', 'e': 'tan', 'S': 'skin', 's': 'skinShade', 'Y': 'gold', 'O': 'orange',
          'R': 'rust', 'r': 'darkRed', 'b': 'darkBrown', 'd': 'deepBrown'},
         {'idle': idle, 'attack': atk})





def stamp(g, art, x0, y0, outline=True):
    """Overlay a small hand-drawn item. Its own outline only lands on empty pixels, so the body stays intact."""
    s = Grid()
    for dy, row in enumerate(art):
        s.put(x0, y0 + dy, row.replace('.', ' '))
    if outline:
        s.outline()
    for y in range(32):
        for x in range(32):
            c = s.g[y][x]
            if c == '.':
                continue
            if c == 'K' and g.g[y][x] != '.':
                continue
            g.g[y][x] = c


LEGS = {
    23: [(10, 'KpbKKpbK')],
    24: [(10, 'KpbKKpbK')],
    25: [(10, 'KBbKKBbK')],
    26: [(10, 'KpbKKpbK')],
    27: [(10, 'KbBKKbBK')],
    28: [(10, 'KbBKKbBK')],
    29: [(10, 'KbBBKbBBK')],
    30: [(10, 'KKKKKKKKK')],
}

# ------------------------------------------------------------------ Ranger
RANGER = {
    3: [(11, 'KKKK')],
    4: [(10, 'KGGggKK')],
    5: [(10, 'KGggggdK')],
    6: [(10, 'KGgddddgK')],
    7: [(10, 'KGgdSKSSK')],
    8: [(6, 'KKK'), (10, 'KGgdsSSSSK')],
    9: [(6, 'KWRKKGgdSSSsK')],
    10: [(6, 'KbbKKGgdSSsK')],
    11: [(6, 'KbbK'), (11, 'KggddK')],
    12: [(6, 'KbbKKgggYgdK')],
    13: [(6, 'KGdTTBBBBBbbBK')],
    14: [(5, 'KGgdTBBBBBBbpBbK')],
    15: [(5, 'KGgdTBBBBBbbpKBbK')],
    16: [(4, 'KGggdTBBBBBbbpKBbS S')],
    17: [(4, 'KGggdTBBBBBbppKKKs s')],
    18: [(4, 'KGggdTbbbbYbbpK')],
    19: [(3, 'KGgggdKTBBBBbppK')],
    20: [(3, 'KGggdgKTBBBBbppK')],
    21: [(3, 'KGggdgKBBBBbbppK')],
    22: [(3, 'KGggdgKbbbbbpppK')],
    23: [(3, 'KKKKKK')],
    **{y: r for y, r in LEGS.items() if y != 23},
}
RANGER[23] = [(3, 'KKKKKK'), (10, 'KpbKKpbK')]

BOW = [
    'b...',
    '.B..',
    '..B.',
    '..B.',
    '...B',
    '...B',
    '...B',
    '...B',
    '...B',
    '...B',
    '...B',
    '...B',
    '...B',
    '...B',
    '...B',
    '..B.',
    '..B.',
    '.B..',
    'b...',
]


def ranger():
    idle = draw(RANGER)
    stamp(idle, BOW, 19, 8)
    idle.vline(19, 9, 25, 'L')
    for (x, y, c) in ((18, 15, 'B'), (19, 15, 'b'), (19, 16, 'B'), (20, 16, 'b'), (21, 16, 'S'), (23, 16, 'S'),
                      (21, 17, 's'), (23, 17, 's')):
        idle.px(x, y, c)

    atk = draw(RANGER)
    stamp(atk, BOW, 19, 8)
    atk.line(19, 9, 15, 16, 'L')
    atk.line(15, 16, 19, 25, 'L')
    stamp(atk, ['TTTTTTTTWL'], 15, 16)
    for (x, y, c) in ((14, 15, 'S'), (14, 16, 'S'), (21, 15, 'S'), (23, 15, 'S'), (21, 17, 's'), (23, 17, 's'),
                      (18, 15, 'B'), (19, 15, 'B'), (20, 15, 'b')):
        atk.px(x, y, c)
    emit(f'{OUT}/ranger.ts', 'RANGER_SPRITE',
         {'K': 'black', 'G': 'green', 'g': 'midGreen', 'd': 'darkGreen', 'S': 'skin', 's': 'skinShade', 'Y': 'gold',
          'T': 'tan', 'B': 'brown', 'b': 'darkBrown', 'p': 'deepBrown', 'W': 'white', 'R': 'red', 'L': 'lightGray'},
         {'idle': idle, 'attack': atk})



def rot_cw(art):
    """Rotate a stamp 90 degrees clockwise: the top of the item ends up pointing right."""
    h, w = len(art), len(art[0])
    return [''.join(art[h - 1 - r][c] for r in range(h)) for c in range(w)]


# ------------------------------------------------------------------ Barbarian
BARBARIAN = {
    1: [(13, 'KK')],
    2: [(12, 'KOOK')],
    3: [(11, 'KKOOKKK')],
    4: [(10, 'KESOOSSsK')],
    5: [(10, 'KESSSSSsK')],
    6: [(10, 'KSSSSbbSK')],
    7: [(10, 'KSsSSKSSSK')],
    8: [(10, 'KSSSOOOORK')],
    9: [(10, 'KSSOOOORRK')],
    10: [(11, 'KOOORRRK')],
    11: [(12, 'KOORRK')],
    12: [(7, 'KKKKKKsSsKKKKK')],
    13: [(6, 'KFFfBESSSSSsSsK')],
    14: [(6, 'KFffBEssSsssSsK')],
    15: [(7, 'KBBKESSSSSsSsK')],
    16: [(7, 'KSsKESsSsSsSsK')],
    17: [(7, 'KSsKESSSSSsSSSS')],
    18: [(7, 'KSsKEsSSSssSsss')],
    19: [(7, 'KSSKbbbYbbbdK')],
    20: [(7, 'KKKKFfffFfBBK')],
    21: [(9, 'KfffBffBBK')],
    22: [(9, 'KfBfKfBfBK')],
    23: [(10, 'KSsKKSsK')],
    24: [(10, 'KSsKKSsK')],
    25: [(10, 'KEsKKEsK')],
    26: [(10, 'KSsKKSsK')],
    27: [(10, 'KFfKKFfK')],
    28: [(10, 'KfBKKfBK')],
    29: [(10, 'KfBBKfBBK')],
    30: [(10, 'KKKKKKKKK')],
}

AXE = ['WLBLM', 'WLBLM', 'WLBLM', 'WLBLM', '.LBL.', '..B..', '..B..', '..B..', '..b..', '..B..', '..B..', '..B..', '..b..']


def barbarian():
    idle = draw(BARBARIAN)
    stamp(idle, AXE, 20, 7)
    idle.put(21, 17, 'S')
    idle.put(23, 17, 'S')
    idle.put(21, 18, 's')
    idle.put(23, 18, 's')

    atk = draw(BARBARIAN)
    atk.clear(19, 17, 21, 18)
    atk.put(18, 17, 'K')
    atk.put(18, 18, 'K')
    stamp(atk, rot_cw(AXE), 19, 13)
    atk.put(20, 14, 'S')
    atk.put(20, 16, 's')
    emit(f'{OUT}/barbarian.ts', 'BARBARIAN_SPRITE',
         {'K': 'black', 'E': 'sand', 'S': 'skin', 's': 'skinShade', 'O': 'orange', 'R': 'rust', 'F': 'tan',
          'f': 'brown', 'B': 'darkBrown', 'b': 'darkBrown', 'd': 'deepBrown', 'Y': 'gold', 'W': 'white', 'L': 'lightGray',
          'M': 'gray'},
         {'idle': idle, 'attack': atk})



# ------------------------------------------------------------------ Paladin
PALADIN = {
    1: [(12, 'KKK')],
    2: [(11, 'KGGgK')],
    3: [(11, 'KGggK')],
    4: [(10, 'KWLLLLMK')],
    5: [(9, 'KWLLLLLMAK')],
    6: [(9, 'KWLLLGGGGGK')],
    7: [(9, 'KLLLMSSKSSK')],
    8: [(9, 'KLLLMsSSSSSK')],
    9: [(9, 'KLLLMsSSSsK')],
    10: [(9, 'KMLLMMSSsK')],
    11: [(10, 'KMMMMMMAK')],
    12: [(8, 'KWLLLLLLLMAK')],
    13: [(6, 'KVKLLLLGLLLMAAK')],
    14: [(5, 'KVNKLLGGGGGLMAMK')],
    15: [(5, 'KVNKLLLLGLLMMAMK')],
    16: [(5, 'KVNKLLLLGLLMMAMK')],
    17: [(4, 'KVVNKLLLLGLMMAAMK')],
    18: [(4, 'KVVNKGGGGGGGggAMK')],
    19: [(4, 'KVVNNKLLLLLMMAK')],
    20: [(3, 'KVVVNNKLLLLMMAAK')],
    21: [(3, 'KVVVNNKWLLLMMAAK')],
    22: [(3, 'KVVNNNKMMMMAAAAK')],
    23: [(3, 'KVVNNNKKLMKKLMK')],
    24: [(4, 'KVNNNKKLMKKLMK')],
    25: [(4, 'KKKKKK'), (10, 'KWMKKWMK')],
    26: [(10, 'KLMKKLMK')],
    27: [(10, 'KMAKKMAK')],
    28: [(10, 'KMAKKMAK')],
    29: [(10, 'KMAAKMAAK')],
    30: [(10, 'KKKKKKKKK')],
}

HAMMER = ['WLLLM', 'WLLLM', 'LLLMA', 'MMMAA'] + ['..H..', '..H..', '..b..'] * 4


def paladin():
    idle = draw(PALADIN)
    stamp(idle, HAMMER, 19, 3)
    idle.put(20, 16, 'L')
    idle.put(22, 16, 'L')
    idle.put(20, 17, 'M')
    idle.put(22, 17, 'M')

    atk = draw(PALADIN)
    stamp(atk, rot_cw(HAMMER), 16, 14)
    atk.put(18, 15, 'L')
    atk.put(18, 17, 'M')
    emit(f'{OUT}/paladin.ts', 'PALADIN_SPRITE',
         {'K': 'black', 'W': 'white', 'L': 'lightGray', 'M': 'gray', 'A': 'slate', 'G': 'gold', 'g': 'orange',
          'V': 'navy', 'N': 'night', 'S': 'skin', 's': 'skinShade', 'H': 'brown', 'b': 'darkBrown'},
         {'idle': idle, 'attack': atk})



def robe(g, main, hi, fold, shade, trim, y0=13, y1=27, folds=((11, 18), (14, 21)), split=None, belt=None, ragged=False):
    """Robe flaring from 8px (x9-16) to 14px (x6-19); highlight on the lit left, shadow widening to the right,
    fold lines, a trim hem, optional front split or belt, and an outline drawn explicitly."""
    for y in range(y0, y1 + 1):
        t = (y - y0) / (y1 - y0)
        x0 = 9 - round(t * 3)
        x1 = 16 + round(t * 3)
        row = [main] * (x1 - x0 + 1)
        row[0] = hi
        if t > 0.4:
            row[1] = hi
        shade_w = 1 + round(t * 2)
        for i in range(shade_w):
            row[-1 - i] = shade
        for (fx, fy) in folds:
            if y >= fy and x0 <= fx <= x1:
                row[fx - x0] = fold
        if split and y >= split[1]:
            for sx in range(split[0][0], split[0][1] + 1):
                row[sx - x0] = split[2]
        if belt and y == belt[0]:
            row = [belt[1]] * len(row)
        if y == y1:
            row = [trim] * len(row)
        g.put(x0 - 1, y, 'K' + ''.join(row) + 'K')
    if ragged:
        g.put(6, y1 + 1, 'K.K.K.K.K.K.K.K')
        for x in range(6, 21, 2):
            g.px(x, y1, trim)
        for x in range(7, 21, 2):
            g.px(x, y1, '.')
            g.px(x, y1 + 1, 'K')
        g.put(6, y1 + 1, 'K')
    g.put(7, 28, 'KKKbbKKKbbKKK')
    g.put(9, 29, 'KbbK.KbbK')
    g.put(9, 30, 'KKKK.KKKK')


def robe_sleeve(g, main, shade, hand, hand_shade):
    """Front sleeve from the shoulder to a hand gripping an item at x23 (hand pixels at x22 and x24)."""
    g.put(17, 13, main + shade + 'K')
    g.put(17, 14, main + main + shade + 'K')
    g.put(18, 15, main + main + shade + 'K')
    g.put(19, 16, main + shade + hand + ' ' + hand + 'K')
    g.put(19, 17, 'KK' + hand_shade + ' ' + hand_shade + 'K')
    g.put(21, 18, 'K K')


# ------------------------------------------------------------------ Necromancer
NECRO_HEAD = {
    2: [(12, 'KKK')],
    3: [(11, 'KtTTK')],
    4: [(10, 'KtTTTTK')],
    5: [(10, 'KtTTTTTnK')],
    6: [(9, 'KtTTTKKKKnK')],
    7: [(9, 'KtTTnKKKKnK')],
    8: [(9, 'KtTTnKKGKnK')],
    9: [(9, 'KtTTnKKKKnK')],
    10: [(9, 'KtTTTTnnnK')],
    11: [(10, 'KtTTTnnnK')],
    12: [(9, 'KKtTTTTnnK')],
}
BONE_STAFF = [' G ', 'GYG', 'gGg', 'WWW', 'WKW', 'WWW', ' L ', ' L '] + [' L '] * 17


def necromancer():
    idle = draw(NECRO_HEAD)
    robe(idle, 'T', 't', 't', 'n', 'L')
    robe_sleeve(idle, 'T', 'n', 'E', 'E')
    stamp(idle, BONE_STAFF, 22, 2)
    idle.put(22, 16, 'E')
    idle.put(24, 16, 'E')

    atk = draw(NECRO_HEAD)
    robe(atk, 'T', 't', 't', 'n', 'L')
    robe_sleeve(atk, 'T', 'n', 'E', 'E')
    tilted = [(' ' * (2 - min(2, i // 6))) + r + (' ' * min(2, i // 6)) for i, r in enumerate(BONE_STAFF)]
    stamp(atk, tilted, 22, 2)
    atk.put(23, 16, 'E')
    atk.put(25, 16, 'E')
    emit(f'{OUT}/necromancer.ts', 'NECROMANCER_SPRITE',
         {'K': 'black', 'T': 'deepTeal', 't': 'darkGreen', 'n': 'night', 'G': 'green', 'g': 'midGreen', 'Y': 'yellow',
          'W': 'white', 'L': 'lightGray', 'E': 'sand', 'b': 'deepBrown'},
         {'idle': idle, 'attack': atk})


# ------------------------------------------------------------------ Druid
DRUID_HEAD = {
    4: [(10, 'KbbbbbbK')],
    5: [(9, 'KbBBSSSSsK')],
    6: [(9, 'KbBSSSKSsK')],
    7: [(9, 'KbBSSSSSSSK')],
    8: [(9, 'KbBSSSSSsK')],
    9: [(9, 'KbBbbbbbK')],
    10: [(10, 'KbBbbbK')],
}
ANTLERS = ['E...E', '.E.E.', '..E..', '..E..']
LEAF = ['Gg.', 'ggd', '.gd']
LEAF_STAFF = ['.GgG.', 'GgGgG', 'gGpGg', '.gpg.'] + ['..p..', '..b..'] * 11


def druid():
    frames = {}
    for name in ('idle', 'attack'):
        g = draw(DRUID_HEAD)
        stamp(g, ANTLERS, 8, 0)
        stamp(g, ['F.F', '.F.'], 14, 1)
        robe(g, 'B', 'T', 'b', 'p', 'g', folds=((11, 20), (14, 22)), belt=(19, 'g'), ragged=True)
        for x in (8, 11, 14):
            stamp(g, LEAF, x, 11)
        robe_sleeve(g, 'B', 'p', 'S', 's')
        dx = 0 if name == 'idle' else 2
        stamp(g, LEAF_STAFF, 21 + dx, 3)
        g.put(22 + dx, 16, 'S')
        g.put(24 + dx, 16, 'S')
        if dx:
            g.put(21, 16, 'BS')
        frames[name] = g
    emit(f'{OUT}/druid.ts', 'DRUID_SPRITE',
         {'K': 'black', 'E': 'sand', 'F': 'tan', 'b': 'darkBrown', 'B': 'brown', 'T': 'tan', 'p': 'deepBrown',
          'G': 'green', 'g': 'midGreen', 'd': 'darkGreen', 'S': 'skin', 's': 'skinShade'},
         frames)


# ------------------------------------------------------------------ Warlock
WARLOCK_HEAD = {
    3: [(11, 'KKKK')],
    4: [(10, 'KRrrrKK')],
    5: [(10, 'KRrrrrrK')],
    6: [(9, 'KRrrPSSSSK')],
    7: [(9, 'KRrrPSQSSK')],
    8: [(9, 'KRrrPSSSSSK')],
    9: [(9, 'KRrrPsSSsK')],
    10: [(10, 'KRrrPPPK')],
    11: [(10, 'KRrrrPPK')],
    12: [(9, 'KKRrrrPPK')],
}
FLAME_SMALL = ['.R.', 'ROR', 'OYO', '.O.']
FLAME_BIG = ['.R.R.', 'RORO.', 'OYYOR', 'OYWYO', 'ROYOR', '.ROR.']


def warlock():
    frames = {}
    for name in ('idle', 'attack'):
        g = draw(WARLOCK_HEAD)
        stamp(g, ['E..', '.E.', '..E'], 8, 1)
        stamp(g, ['E', 'F'], 13, 1)
        robe(g, 'r', 'R', 'P', 'P', 'G', folds=((11, 18),), split=((12, 14), 20, 'P'))
        if name == 'idle':
            g.put(17, 13, 'rPK')
            g.put(17, 14, 'rrPK')
            g.put(18, 15, 'rrGK')
            g.put(20, 16, 'SS')
            stamp(g, FLAME_SMALL, 20, 12)
        else:
            g.put(17, 13, 'rPKKKKK')
            g.put(17, 14, 'rrrrrGSS')
            g.put(17, 15, 'rPPPPGss')
            g.put(18, 16, 'KKKKKK')
            stamp(g, FLAME_BIG, 25, 11)
        frames[name] = g
    emit(f'{OUT}/warlock.ts', 'WARLOCK_SPRITE',
         {'K': 'black', 'E': 'sand', 'F': 'tan', 'r': 'darkRed', 'R': 'red', 'P': 'deepBrown', 'S': 'skin',
          's': 'skinShade', 'Q': 'hotRed', 'G': 'gold', 'O': 'orange', 'Y': 'yellow', 'W': 'white', 'b': 'deepBrown'},
         frames)


# ------------------------------------------------------------------ Bard
BARD = {
    1: [(6, 'KK')],
    2: [(5, 'KRRK'), (10, 'KKKKKK')],
    3: [(6, 'KRRKCUUUUUNK')],
    4: [(7, 'KKUUUUUUUUNK')],
    5: [(8, 'KNNBSSSSsK')],
    6: [(9, 'KBSSSKSsK')],
    7: [(9, 'KBSSSSSSSK')],
    8: [(9, 'KBSSSSSsK')],
    9: [(10, 'KBSSSsK')],
    10: [(11, 'KSSsK')],
    11: [(8, 'KKYYYYYYYYK')],
    12: [(8, 'KCUUUUUUNNK')],
    13: [(8, 'KCUUUUUNNNK')],
    14: [(8, 'KCUUUUUUNNK')],
    15: [(8, 'KCUUUUUNNNK')],
    16: [(8, 'KCUUUUUNNNK')],
    17: [(8, 'KCUUUUUUNNK')],
    18: [(9, 'KbbbYbbbbK')],
    19: [(9, 'KCUUUUUNNK')],
    20: [(9, 'KCUUUUNNNK')],
    21: [(9, 'KNNNNNNNNK')],
    22: [(10, 'KpbKKpbK')],
    **{y: r for y, r in LEGS.items() if y != 23},
}
LUTE = ['..........bb', '.........bB.', '........bB..', '.......bB...', '..FFF.bB....', '.FFFFbB.....',
        'FFFKFF......', 'FFFFFf......', '.FFFf.......', '..Ff........']


def bard():
    frames = {}
    for name in ('idle', 'attack'):
        g = draw(BARD)
        g.put(19, 12, 'K')
        stamp(g, LUTE, 7, 9)
        if name == 'idle':
            g.put(19, 13, 'SK')
            g.put(18, 11, 'SS')
        else:
            g.put(19, 12, 'KKKKKK')
            g.put(18, 13, 'UUUSSK')
            g.put(18, 14, 'NNNssK')
            g.put(19, 15, 'KKKKK')
        g.put(10, 16, 'SS')
        frames[name] = g
    emit(f'{OUT}/bard.ts', 'BARD_SPRITE',
         {'K': 'black', 'R': 'red', 'C': 'cyan', 'U': 'blue', 'N': 'navy', 'B': 'darkBrown', 'S': 'skin',
          's': 'skinShade', 'Y': 'gold', 'b': 'darkBrown', 'p': 'deepBrown', 'F': 'tan', 'f': 'brown'},
         frames)


if __name__ == "__main__":
    for name in sys.argv[1:]:
        globals()[name]()
        print('wrote', name)
