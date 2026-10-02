"""Summon and critter sprites. Every fill and shading pixel is placed by hand; only the single outer
silhouette outline is generated (no internal seams). Summons face right; the critter faces left.

Usage: python3 tools/sprites/creatures.py wolf hawk ...   (writes src/art/sprites/<name>.ts)
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from paint import Grid, emit  # noqa: E402

OUT = str(Path(__file__).resolve().parents[2] / 'src' / 'art' / 'sprites')


def sprite(rows):
    """rows: list of (y, 32-char fill string). Returns an outlined Grid."""
    g = Grid()
    for y, line in rows:
        assert len(line) == 32, (y, len(line), line)
        g.put(0, y, line.replace('.', ' '))
    return g.outline()


def frames(idle_rows, attack_rows):
    return {'idle': sprite(idle_rows), 'attack': sprite(attack_rows)}


# ------------------------------------------------------------------ Wolf
WOLF = [
    (12, '.....................L..........'),
    (13, '....................LML.........'),
    (14, '...................LMMMLL.......'),
    (15, '...................LMMMYKM......'),
    (16, '..................LMMMMMMMMMMK..'),
    (17, '..................LMMMMMMAAAA...'),
    (18, '..................MMMMMMAA......'),
    (19, '..............LLLLMMMMMAA.......'),
    (20, '...LLMMLLLLLLLMMMMMMMMMAA.......'),
    (21, '..LMA.LMMMMMMMMMMMMMMMMAAA......'),
    (22, '..LMA.LMMMMMMMMMMMMMMMAAA.......'),
    (23, '..MMA.LMMMMMMMMMMMMMMAAAA.......'),
    (24, '...MA.MAAAMMMMMMMMMMAAAA........'),
    (25, '...AA.MA.AAAAAAAAAAAA.AA........'),
    (26, '......MA.AA......MA...AA........'),
    (27, '......MA.AA......MA...AA........'),
    (28, '......MA.AA......MA...AA........'),
    (29, '......NN.NN......NN...NN........'),
]
WOLF_ATTACK = [
    (13, '......................L.........'),
    (14, '.....................LML........'),
    (15, '....................LMMMLL......'),
    (16, '....................LMMMYKM.....'),
    (17, '...................LMMMMMMMMMMK.'),
    (18, '...................LMMMWRRRR....'),
    (19, '..............LLLLLLMMMWAAAA....'),
    (20, '..LLLMMLLLLLLLMMMMMMMMMAA.......'),
    (21, '.LMA..LMMMMMMMMMMMMMMMMAAA......'),
    (22, '......LMMMMMMMMMMMMMMMAAAA......'),
    (23, '......LMMMMMMMMMMMMMMAAAA.......'),
    (24, '......MAAAMMMMMMMMMMAAAA........'),
    (25, '....MMA..AAAAAAAAAAAA..AA.......'),
    (26, '...MA....AA.......MA....AA......'),
    (27, '..MA.....AA........MA....AA.....'),
    (28, '..MA.....AA........MA....AA.....'),
    (29, '..NN.....NN........NN....NN.....'),
]


def wolf():
    emit(f'{OUT}/wolf.ts', 'WOLF_SPRITE',
         {'K': 'black', 'L': 'lightGray', 'M': 'gray', 'A': 'slate', 'N': 'darkSlate', 'Y': 'yellow', 'W': 'white', 'R': 'red'},
         frames(WOLF, WOLF_ATTACK))



def shift(rows, dx=0, dy=0):
    """Move a drawing; used for simple attack poses (lunge, dive) without redrawing."""
    out = []
    for y, line in rows:
        if dx > 0:
            line = '.' * dx + line[:-dx]
        elif dx < 0:
            line = line[-dx:] + '.' * (-dx)
        out.append((y + dy, line))
    return out


def edit(rows, changes):
    """Replace whole rows by y."""
    d = dict(rows)
    d.update(changes)
    return sorted(d.items())


# ------------------------------------------------------------------ Hawk
HAWK = [
    (6, '..d.............................'),
    (7, '..db............................'),
    (8, '..dBb...........................'),
    (9, '...dBb..........................'),
    (10, '...dTBb.........................'),
    (11, '....dTBb........................'),
    (12, '....dTTBb.........WW............'),
    (13, '.....dTTBb.......WWWKY..........'),
    (14, '.....dTTTBb.....LWWWYYO.........'),
    (15, '......dTTBBbbbbBLWWL............'),
    (16, '.......dBBBBBBBBBBLL............'),
    (17, '...bbbbbBBBBBBBBBBb.............'),
    (18, '..bBBbbbbbBBBBBBBb..............'),
    (19, '...bb.....bbbBBbb...............'),
    (20, '.............YY.YY..............'),
]
HAWK_DIVE = [
    (7, '.d..........d...................'),
    (8, '.db........db...................'),
    (9, '..dBb......dBb..................'),
    (10, '..dTBb.....dTBb.................'),
    (11, '...dTBb....dTTBb................'),
    (12, '....dTBb....dTBb................'),
    (13, '.....dTBb...dTBBb...............'),
    (14, '......dBBb..dBBBb...............'),
    (15, '.......dBBBbBBBBBb..............'),
    (16, '........bBBBBBBBBBb.............'),
    (17, '.........bBBBBBBBBBb............'),
    (18, '..........bbBBBBBBBLW...........'),
    (19, '............bbBBBBLWWW..........'),
    (20, '..............bbBBWWWWK.........'),
    (21, '................bbLWWWYO........'),
    (22, '..................YY.YY.........'),
]


def hawk():
    emit(f'{OUT}/hawk.ts', 'HAWK_SPRITE',
         {'K': 'black', 'W': 'white', 'L': 'lightGray', 'Y': 'gold', 'O': 'orange', 'T': 'tan', 'B': 'brown',
          'b': 'darkBrown', 'd': 'deepBrown'},
         frames(HAWK, HAWK_DIVE))


# ------------------------------------------------------------------ Bear
BEAR = [
    (7, '....................bb..........'),
    (8, '..............TTT..bTTb.........'),
    (9, '...........TTTTBBTTbBBBB........'),
    (10, '........TTTBBBBBBBBTBBBBBB......'),
    (11, '......TTBBBBBBBBBBBBTBBBKBB.....'),
    (12, '.....TBBBBBBBBBBBBBBBTBBBBBEE...'),
    (13, '....TBBBBBBBBBBBBBBBBBBBBBEEEEK.'),
    (14, '....TBBBBBBBBBBBBBBBBBBBBbEEEE..'),
    (15, '....BBBBBBBBBBBBBBBBBBBBbbbbb...'),
    (16, '....BBBBBBBBBBBBBBBBBBBBbbb.....'),
    (17, '....BBBBBBBBBBBBBBBBBBBbbbb.....'),
    (18, '....bBBBBBBBBBBBBBBBBBbbbbb.....'),
    (19, '....bbBBBBBBBBBBBBBBBbbbbbb.....'),
    (20, '....bbbbBBBBBBBBBBBbbbbbbbb.....'),
    (21, '....bbbbbbbbbbbbbbbbbbbbbbb.....'),
    (22, '....bBBBb.........bBBBBbbb......'),
    (23, '....bBBBb.........bBBBBbb.......'),
    (24, '....bBBBb.........bBBBBb........'),
    (25, '....bBBBb.........bBBBBb........'),
    (26, '....bBBBb.........bBBBBb........'),
    (27, '....bBBBb.........bBBBBb........'),
    (28, '....bBBBb.........bBBBBb........'),
    (29, '....ddddd.........dddddd........'),
]
BEAR_ATTACK = [
    (1, '....................bb..W.W.W...'),
    (2, '...................bTTb.BBBB....'),
    (3, '..................bBBBBTBBBb....'),
    (4, '.................TBBBBKBBBb.....'),
    (5, '................TBBBBBBEEE......'),
    (6, '...............TBBBBBBEERRK.....'),
    (7, '..............TBBBBBBBbEEE......'),
    (8, '.............TBBBBBBBBbb........'),
    (9, '............TBBBBBBBBBbBBb......'),
    (10, '...........TBBBBBBBBBBbBBBbWW...'),
    (11, '...........BBBBBBBBBBBbb........'),
    (12, '..........TBBBBBBBBBBbb.........'),
    (13, '..........BBBBBBBBBBBbb.........'),
    (14, '..........BBBBBBBBBBbbb.........'),
    (15, '..........BBBBBBBBBBbbb.........'),
    (16, '..........bBBBBBBBBBbbb.........'),
    (17, '..........bBBBBBBBBbbbb.........'),
    (18, '..........bbBBBBBBBbbbb.........'),
    (19, '..........bbbBBBBBbbbbb.........'),
    (20, '...........bbbbbbbbbbb..........'),
    (21, '...........bBBBb.bBBBb..........'),
    (22, '...........bBBBb.bBBBb..........'),
    (23, '...........bBBBb.bBBBb..........'),
    (24, '...........bBBBb.bBBBb..........'),
    (25, '...........bBBBb.bBBBb..........'),
    (26, '...........bBBBb.bBBBb..........'),
    (27, '...........bBBBb.bBBBb..........'),
    (28, '...........bBBBb.bBBBb..........'),
    (29, '..........ddddd.ddddd...........'),
]


def bear():
    emit(f'{OUT}/bear.ts', 'BEAR_SPRITE',
         {'K': 'black', 'T': 'tan', 'B': 'brown', 'b': 'darkBrown', 'd': 'deepBrown', 'W': 'white', 'R': 'darkRed',
          'E': 'sand'},
         frames(BEAR, BEAR_ATTACK))


# ------------------------------------------------------------------ Boar
BOAR = [
    (12, '..............DDDD..............'),
    (13, '............DDDDDDDD............'),
    (14, '..........DDDbbbbbbDDd..........'),
    (15, '........DDbbBBBBBBBBbbd.........'),
    (16, '......DDbBBBBBBBBBBBBBBd........'),
    (17, '.....dbBBBBBBBBBBBBBBBBBd.......'),
    (18, '....dbBBBBBBBBBBBBBBBBBBBd......'),
    (19, '....dBBBBBBBBBBBBBBBBBBKBBd.....'),
    (20, '....dBBBBBBBBBBBBBBBBBBBBBBWW...'),
    (21, '....ddBBBBBBBBBBBBBBBBBBBBBWPP..'),
    (22, '.....dddBBBBBBBBBBBBBBBBBBBPPp..'),
    (23, '......ddddddBBBBBBBBBBBBddd.....'),
    (24, '......DDD.....dddddd..DDD.......'),
    (25, '......dBd.............dBBd......'),
    (26, '......dBd.............dBBd......'),
    (27, '......dBd.............dBBd......'),
    (28, '......dBd.............dBBd......'),
    (29, '......NNN.............NNNN......'),
]
BOAR_CHARGE = [
    (11, '.................DDD............'),
    (12, '...............DDDDDDD..........'),
    (13, '.............DDDbbbbbDDd........'),
    (14, '...........DDbbBBBBBBbbDd.......'),
    (15, '.........DDbBBBBBBBBBBBBBd......'),
    (16, '.......DDbBBBBBBBBBBBBBBBBd.....'),
    (17, '......dbBBBBBBBBBBBBBBBBBBBd....'),
    (18, '.....dBBBBBBBBBBBBBBBBBBBBBBd...'),
    (19, '.....dBBBBBBBBBBBBBBBBBBBBBBBd..'),
    (20, '.....ddBBBBBBBBBBBBBBBBBBBKBBBW.'),
    (21, '......ddBBBBBBBBBBBBBBBBBBBBBWW.'),
    (22, '.......dddBBBBBBBBBBBBBBBBBBBPP.'),
    (23, '........ddddddBBBBBBBBBBBddPPp..'),
    (24, '...DDD......ddddddd....DDD......'),
    (25, '..dBd...................dBBd....'),
    (26, '.dBd.....................dBBd...'),
    (27, 'dBd.......................dBBd..'),
    (28, 'dBd.......................dBBd..'),
    (29, 'NNN.......................NNNN..'),
]


def boar():
    emit(f'{OUT}/boar.ts', 'BOAR_SPRITE',
         {'K': 'black', 'B': 'brown', 'b': 'rust', 'd': 'darkBrown', 'D': 'deepBrown', 'P': 'pink', 'p': 'skinShade',
          'W': 'white', 'N': 'night'},
         frames(BOAR, BOAR_CHARGE))


# ------------------------------------------------------------------ Owl
OWL = [
    (8, '............b....b..............'),
    (9, '............bBbbbBb.............'),
    (10, '...........bBBBBBBBb............'),
    (11, '...........BWWWBWWWBB...........'),
    (12, '...........BWYKBWYKBB...........'),
    (13, '...........BWWWOWWWBB...........'),
    (14, '...........BBWWOWWBBBb..........'),
    (15, '......bb...BTBTBTBTBBbb.........'),
    (16, '.....bTTb..BBTBTBTBBBTTb........'),
    (17, '....bTTBBbBBBBBBBBBBBTBBb.......'),
    (18, '.....bbBBBBBBBBBBBBBBBbb........'),
    (19, '.......bbBBBBBBBBBBBBb..........'),
    (20, '..........bbBBBBBBbb............'),
    (21, '............OO..OO..............'),
]
OWL_SWOOP = [
    (4, '....bb..................bb......'),
    (5, '....bTBb..............bBTb......'),
    (6, '.....bTBb............bBTb.......'),
    (7, '......bTBb..b....b..bBTb........'),
    (8, '.......bTBbbBbbbbBbbBTb.........'),
    (9, '........bBBbBBBBBBBbBBb.........'),
    (10, '..........bBBBBBBBBBb...........'),
    (11, '...........BbbWBWbbBB...........'),
    (12, '...........BWYKBWYKBB...........'),
    (13, '...........BWWWOWWWBB...........'),
    (14, '...........BBWWOWWBBBb..........'),
    (15, '...........BTBTBTBTBBb..........'),
    (16, '...........BBTBTBTBBBb..........'),
    (17, '............bBBBBBBBb...........'),
    (18, '.............bbBBBbb............'),
    (19, '..............OO...OO...........'),
]


def owl():
    emit(f'{OUT}/owl.ts', 'OWL_SPRITE',
         {'K': 'black', 'W': 'white', 'Y': 'yellow', 'O': 'orange', 'T': 'tan', 'B': 'brown', 'b': 'darkBrown'},
         frames(OWL, OWL_SWOOP))


# ------------------------------------------------------------------ Skeleton (summon, faces right)
SKELETON = [
    (4, '............WWWWW...............'),
    (5, '..........EWWWWWWWW.............'),
    (6, '..........EWWWWWWWW.............'),
    (7, '..........EWWGKWWGKK............'),
    (8, '..........EWWKKWWKKK............'),
    (9, '...........EWWWKWW..............'),
    (10, '...........EKWKWKW..............'),
    (11, '..............EE................'),
    (12, '...........WWWWWWWW.............'),
    (13, '..........WE.WWWW.WE............'),
    (14, '..........W.WEWWEW.WE...........'),
    (15, '..........W..WWWW...WE..........'),
    (16, '..........E.WEWWEW...WW.........'),
    (17, '..........W..WWWW...WWWMM.......'),
    (18, '..............EE.......MMM......'),
    (19, '.............WWWW.......MMM.....'),
    (20, '.............W..W........MMR....'),
    (21, '.............W..WW.......RR.....'),
    (22, '.............E...W..............'),
    (23, '.............W...W..............'),
    (24, '.............W...W..............'),
    (25, '.............E...E..............'),
    (26, '.............W...W..............'),
    (27, '.............W...W..............'),
    (28, '.............W...W..............'),
    (29, '............WW...WW.............'),
]
SKELETON_ATTACK = [
    (4, '.............WWWWW..............'),
    (5, '...........EWWWWWWWW............'),
    (6, '...........EWWWWWWWW............'),
    (7, '...........EWWGKWWGKK...........'),
    (8, '...........EWWKKWWKKK...........'),
    (9, '............EWWWKWW.............'),
    (10, '............EKWKWKW.............'),
    (11, '...............EE...............'),
    (12, '............WWWWWWWWWW..........'),
    (13, '...........WE.WWWW..WWWWWWMMMMMR'),
    (14, '...........W.WEWWEW.............'),
    (15, '...........W..WWWW..............'),
    (16, '...........E.WEWWEW.............'),
    (17, '...........W..WWWW..............'),
    (18, '...............EE...............'),
    (19, '..............WWWW..............'),
    (20, '.............W...W..............'),
    (21, '............W.....W.............'),
    (22, '............E......W............'),
    (23, '...........W.......W............'),
    (24, '...........W........W...........'),
    (25, '..........E.........E...........'),
    (26, '..........W..........W..........'),
    (27, '.........W...........W..........'),
    (28, '.........W...........W..........'),
    (29, '........WW...........WW.........'),
]


def skeleton():
    emit(f'{OUT}/skeleton.ts', 'SKELETON_SPRITE',
         {'K': 'black', 'W': 'white', 'E': 'sand', 'G': 'green', 'M': 'gray', 'R': 'rust'},
         frames(SKELETON, SKELETON_ATTACK))


# ------------------------------------------------------------------ Zombie
ZOMBIE = [
    (8, '.............bbbb...............'),
    (9, '............bGGGGG..............'),
    (10, '............GGGGKGG.............'),
    (11, '............gGGGGGGG............'),
    (12, '.............gGGRRG.............'),
    (13, '..............gGGg..............'),
    (14, '...........UUUUUUUGGGGGGG.......'),
    (15, '..........UUUUUUUUUgggggggG.....'),
    (16, '..........UUUNUUUUNgggggg.......'),
    (17, '..........UUUUUUUUN.............'),
    (18, '...........UUUNUUUN.............'),
    (19, '...........UNUUUUN..............'),
    (20, '...........bbbbbbb..............'),
    (21, '...........PPPPPPp..............'),
    (22, '..........PPp..PPp..............'),
    (23, '..........PPp...PPp.............'),
    (24, '.........PPp....gGg.............'),
    (25, '.........gGg.....PPp............'),
    (26, '.........PPp.....PPp............'),
    (27, '.........PPp.....PPp............'),
    (28, '.........PPp.....PPp............'),
    (29, '.........gggg....gggg...........'),
]
ZOMBIE_ATTACK = [
    (7, '...............bbbb.............'),
    (8, '..............bGGGGG............'),
    (9, '..............GGGGKGG...GG......'),
    (10, '..............gGGGGGGG.GGGG.....'),
    (11, '...............gGGRRRGGGggG.....'),
    (12, '................gGRRgGGgg.......'),
    (13, '.............UUUUUUGGGg.........'),
    (14, '............UUUUUUUUGGGGGGGGG...'),
    (15, '...........UUUUUUUUUggggggggg...'),
    (16, '...........UUNUUUUUN............'),
    (17, '...........UUUUUUUN.............'),
    (18, '...........UUUNUUUN.............'),
    (19, '...........UNUUUUN..............'),
    (20, '...........bbbbbbb..............'),
    (21, '...........PPPPPPp..............'),
    (22, '..........PPp...PPp.............'),
    (23, '.........PPp.....PPp............'),
    (24, '........PPp.......gGg...........'),
    (25, '.......gGg.........PPp..........'),
    (26, '.......PPp..........PPp.........'),
    (27, '.......PPp..........PPp.........'),
    (28, '.......PPp..........PPp.........'),
    (29, '.......gggg.........gggg........'),
]


def zombie():
    emit(f'{OUT}/zombie.ts', 'ZOMBIE_SPRITE',
         {'K': 'black', 'G': 'green', 'g': 'midGreen', 'b': 'darkBrown', 'R': 'darkRed', 'U': 'blue', 'N': 'navy',
          'P': 'slate', 'p': 'darkSlate'},
         frames(ZOMBIE, ZOMBIE_ATTACK))


# ------------------------------------------------------------------ Wraith
WRAITH = [
    (4, '.............PPP................'),
    (5, '............PPMMP...............'),
    (6, '...........PPMMMMP..............'),
    (7, '..........PPMMMMMMP.............'),
    (8, '..........PMMNNNNMP.............'),
    (9, '..........PMNCNCNMP.............'),
    (10, '..........PMMNNNNMMP............'),
    (11, '.........PMMMMMMMMMMP...........'),
    (12, '........PMMMMMMMMMMMNPLL........'),
    (13, '........PMMMMMMMMMMMNLLL........'),
    (14, '........PMMMMMMMMMMMNP..........'),
    (15, '.........PMMMMMMMMMNP...........'),
    (16, '.........PMMMMMMMMNP............'),
    (17, '..........PMMMMMMNP.............'),
    (18, '..........PMMP.PMNP.............'),
    (19, '...........PMP..PP..............'),
    (20, '............PP...P..............'),
    (21, '.............P..................'),
]
WRAITH_ATTACK = [
    (4, '..............PPP...............'),
    (5, '.............PPMMP..............'),
    (6, '............PPMMMMP.............'),
    (7, '...........PPMMMMMMP............'),
    (8, '...........PMMNNNNMP............'),
    (9, '...........PMCCNCCMP............'),
    (10, '...........PMMNNNNMMP...........'),
    (11, '..........PMMMMMMMMMMP..........'),
    (12, '.........PMMMMMMMMMMMNPLLLLL....'),
    (13, '.........PMMMMMMMMMMMNLLLCLL....'),
    (14, '.........PMMMMMMMMMMMNPLLLL.....'),
    (15, '..........PMMMMMMMMMNPLLCL......'),
    (16, '.........PMMMMMMMMMNP...........'),
    (17, '.......PPMMMMMMMMNP.............'),
    (18, '.....PMMMMP..PMMNP..............'),
    (19, '....PMMP.......PP...............'),
    (20, '...PP...........................'),
]


def wraith():
    emit(f'{OUT}/wraith.ts', 'WRAITH_SPRITE',
         {'K': 'black', 'P': 'plum', 'M': 'night', 'N': 'black', 'C': 'cyan', 'L': 'lightGray'},
         frames([(y + 3, line) for y, line in WRAITH], [(y + 3, line) for y, line in WRAITH_ATTACK]))


# ------------------------------------------------------------------ Imp (warlock familiar)
IMP = [
    (11, '...........E......E.............'),
    (12, '............E....E.NN...........'),
    (13, '............ERRRRENNN...........'),
    (14, '...PP......RRRRRRRRNN...........'),
    (15, '..PpPP.....RRRRYKRR.............'),
    (16, '..PppPP....RRRRRRRRR............'),
    (17, '...PpppP..rRRRKWKWR.............'),
    (18, '....PPPPPrRRRRRRRr..............'),
    (19, '.........rRRRRRRr...............'),
    (20, '.........rRRRRRRRRR.............'),
    (21, '.........rRRRRRRr...............'),
    (22, '..rr.....rRRRRRRr...............'),
    (23, '...rr...rrRRRRRr................'),
    (24, '....rrrrrRRR.RRr................'),
    (25, '.........rRr.rRr................'),
    (26, '.........rRr.rRr................'),
    (27, '........ddd.ddd.................'),
]
IMP_ATTACK = [
    (6, '..................YOY...........'),
    (7, '.................YWWOY..........'),
    (8, '..................YOY...........'),
    (9, '..................RR............'),
    (10, '.................RRR............'),
    (11, '...........E....RRR.............'),
    (12, '..PP........E..RRR..............'),
    (13, '.PpPP.......ERRRRENN............'),
    (14, '.PppPP.....RRRRRRRRNN...........'),
    (15, '..PpppP....RRRRYKRR.............'),
    (16, '...PpppP...RRRRRRRRR............'),
    (17, '....PPPPP.rRRRKWKWR.............'),
    (18, '.........rRRRRRRRr..............'),
    (19, '.........rRRRRRRr...............'),
    (20, '.........rRRRRRRr...............'),
    (21, '.........rRRRRRRr...............'),
    (22, '..rr.....rRRRRRRr...............'),
    (23, '...rr...rrRRRRRr................'),
    (24, '....rrrrrRRR.RRr................'),
    (25, '.........rRr.rRr................'),
    (26, '.........rRr.rRr................'),
    (27, '........ddd.ddd.................'),
]


def imp():
    emit(f'{OUT}/imp.ts', 'IMP_SPRITE',
         {'K': 'black', 'E': 'sand', 'R': 'red', 'r': 'darkRed', 'P': 'plum', 'p': 'magenta', 'W': 'white',
          'd': 'deepBrown', 'Y': 'yellow', 'O': 'orange', 'N': 'night'},
         frames([(y + 2, line) for y, line in IMP], [(y + 2, line) for y, line in IMP_ATTACK]))


# ------------------------------------------------------------------ Critter (transformed enemy, faces left)
CRITTER = [
    (19, '..........WWW.WW................'),
    (20, '.......NNWWLWWWWWW..............'),
    (21, '......NLKNWWWWWLWWW.............'),
    (22, '......NNNNWLWWWWWWWL............'),
    (23, '.......NNWWWWWLWWWWW............'),
    (24, '.........WWWWWWWWWLL............'),
    (25, '..........LLLLLLLLL.............'),
    (26, '..........NN...NN...............'),
    (27, '..........NN...NN...............'),
    (28, '..........NN...NN...............'),
]
CRITTER_HOP = [
    (17, '..........WWW.WW................'),
    (18, '.......NNWWLWWWWWW..............'),
    (19, '......NLKNWWWWWLWWW.............'),
    (20, '......NNNNWLWWWWWWWL............'),
    (21, '.........WWWWWWWWWLL............'),
    (22, '..........LLLLLLLLL.............'),
    (23, '...........NN..NN...............'),
]


def critter():
    emit(f'{OUT}/critter.ts', 'CRITTER_SPRITE',
         {'K': 'black', 'W': 'white', 'L': 'lightGray', 'N': 'darkSlate'},
         frames([(y + 1, line) for y, line in CRITTER], [(y + 1, line) for y, line in CRITTER_HOP]))


# ------------------------------------------------------------------ Shopkeeper
# Front-facing merchant, drawn as a left half and mirrored; the store's counter hides everything below row 25.
SHOPKEEPER_HALF = [
    '................',
    '................',
    '..............rR',
    '.............rRR',
    '.............rRR',
    '............rRRR',
    '...........sSSSS',
    '..........sSSSSS',
    '..........sSKSSS',
    '..........sSSSSS',
    '..........sSSSSs',
    '..........sbbbbb',
    '...........bSSSS',
    '...........sSSSS',
    '............ssSS',
    '.............sss',
    '........bBBBBWWW',
    '.......bBBBBBWWW',
    '......bBBBBBBWGW',
    '......bBBBBBBWWW',
    '......bBBBBBBWGW',
    '......bBBBBBBWWW',
    '......bBBBBBBWGW',
    '......bSSSsBBWWW',
    '......bSSSsBBWWW',
    '......bbbbbbbbbb',
    '......bBBBBBBBBB',
    '......bBBBBBBBBB',
    '......bBBBBBBBBB',
    '......bBBBBBBBBB',
    '......bBBBBBBBBB',
    '................',
]


def shopkeeper():
    rows = [half + half[::-1] for half in SHOPKEEPER_HALF]
    # A gold coin in his left hand (viewer's right), and a gold tassel hanging off the fez.
    rows = [list(r) for r in rows]
    for x, y, c in [(22, 22, 'G'), (23, 22, 'Y'), (22, 23, 'Y'), (23, 23, 'G'), (19, 3, 'G'), (20, 4, 'G'), (20, 5, 'G')]:
        rows[y][x] = c
    rows = [''.join(r) for r in rows]
    g = sprite(list(enumerate(rows)))
    emit(f'{OUT}/shopkeeper.ts', 'SHOPKEEPER_SPRITE',
         {'K': 'black', 'S': 'skin', 's': 'skinShade', 'R': 'red', 'r': 'darkRed', 'W': 'white', 'B': 'brown',
          'b': 'darkBrown', 'G': 'gold', 'Y': 'yellow'},
         {'idle': g, 'attack': g})


# ------------------------------------------------------------------ Act 1 enemies (face left, toward the party)

def ellipse(g, cx, cy, rx, ry, c):
    for y in range(int(cy - ry), int(cy + ry) + 1):
        for x in range(int(cx - rx), int(cx + rx) + 1):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1:
                g.px(x, y, c)


# Sewer rat: wedge head with big round pink ears, arched back, pink feet and a drooping tail.
# (Redrawn after an art review; the attack gapes and reaches rather than shifting, as the snout sits at x=1.)
RAT = [
    (14, '.........LM.....................'),
    (15, '........LPPA....................'),
    (16, '........LPpA....LLLL............'),
    (17, '........MPpA..LLHHMMLL..........'),
    (18, '.....LLLMMAALLHLMMMMMML.........'),
    (19, '....LHLMMMMMLLMMMMMMMMMM........'),
    (20, '...LMMMMMMMMMMMMMMMMMMMMA.......'),
    (21, '..LMMRMMMMMMMMMMMMMMMMMMMA......'),
    (22, '.PMMMMMMMMAMMMMMMMMMMMMMAA......'),
    (23, '..pMMMMMMAAMMMMMMMMMAMMAAA......'),
    (24, '...AWMMMAA.AMMMMMMMAMMMAAAP.....'),
    (25, '.....AAA...AAAMMMMMAMMAANN.P....'),
    (26, '............AAAAAAAAAANNN...P.p.'),
    (27, '............NA.....AAN.......pp.'),
    (28, '...........PPA....PAN...........'),
    (29, '..........PP.....PP.............'),
]
RAT_ATTACK = [
    (15, '..........LMA...................'),
    (16, '.........LPPA....LLLL...........'),
    (17, '.........MPpA..LLHHMMLL.........'),
    (18, '......LLLMMAALLHLMMMMMML........'),
    (19, '....LLHLMMMMMLLMMMMMMMMMM.......'),
    (20, '...LMMMMMMMMMMMMMMMMMMMMMA......'),
    (21, '..LMMRMMMMMMMMMMMMMMMMMMMMA.....'),
    (22, '.PMMMMMMMMMAMMMMMMMMMMMMMAA.....'),
    (23, '..WWMMMMMMAAMMMMMMMMMAMMAAAP....'),
    (24, '...rrrrMAA..AMMMMMMMAMMMAAN.P...'),
    (25, '...WrrMAA...AAAMMMMMAMMANN...P..'),
    (26, '....AAAA....AAAAAAAAAANNN.....P.'),
    (27, '..........NA........AAN.......p.'),
    (28, '........PPA...........NP......p.'),
    (29, '.......PP..............PP.......'),
]


def rat():
    emit(f'{OUT}/rat.ts', 'RAT_SPRITE',
         {'K': 'black', 'H': 'lightGray', 'L': 'gray', 'M': 'slate', 'A': 'darkSlate', 'N': 'night',
          'P': 'pink', 'p': 'skinShade', 'W': 'white', 'R': 'red', 'r': 'darkRed'},
         frames(RAT, RAT_ATTACK))


def mushroom_frame(puff):
    g = Grid()
    squish = 1 if puff else 0
    g.rect(12, 18 + squish, 19, 29, 'S')            # stem
    g.rect(12, 18 + squish, 13, 29, 'T')            # stem shade (left, away from the light... the light is top-left)
    g.rect(18, 18 + squish, 19, 29, 's')
    ellipse(g, 15.5, 14 + squish, 11, 7 - squish, 'R')   # cap
    ellipse(g, 13, 11 + squish, 6, 3 - squish * 0.5, 'O')   # lit dome
    g.rect(5, 17 + squish, 26, 18 + squish, 'r')    # cap rim shade
    for x, y in ((9, 13), (15, 9), (21, 12), (12, 16), (19, 16)):   # white spots
        g.rect(x, y + squish, x + 1, y + 1 + squish, 'W')
    g.px(13, 22, 'K'); g.px(17, 22, 'K')            # eyes
    g.rect(14, 25, 16, 25, 'K') if puff else g.px(15, 25, 'K')   # mouth
    g.rect(10, 29, 21, 30, 'T')                     # foot
    if puff:
        for x, y in ((3, 10), (6, 6), (2, 15), (8, 3), (24, 5), (27, 9)):
            g.px(x, y, 'G'); g.px(x + 1, y, 'g')    # spores drifting off
    return g.outline()


def mushroom():
    emit(f'{OUT}/mushroom.ts', 'MUSHROOM_SPRITE',
         {'K': 'black', 'R': 'red', 'r': 'darkRed', 'O': 'orange', 'W': 'white', 'S': 'sand', 's': 'tan',
          'T': 'skinShade', 'G': 'green', 'g': 'midGreen'},
         {'idle': mushroom_frame(False), 'attack': mushroom_frame(True)})


# Goblin, Ghost, and Spider: redrawn after an art review (goblin face, ghost and spider shading).
GOBLIN = [
    (7, '.............GGGgg..............'),
    (8, '............GGGGgggd............'),
    (9, '...........GGGGgggggd...........'),
    (10, '.....Gg....GGGggggggdd.....gd...'),
    (11, '.....gGGg..GGgggggggdddggggd....'),
    (12, '......gdGGGttgggttggdddgdd......'),
    (13, '..........GgYYgggYYgddt.........'),
    (14, '..........GgKYgggKYgddt.........'),
    (15, '..........GggggGgggggdt.........'),
    (16, '..........gggggdggggddt.........'),
    (17, '...........gdWWtWWtddt..........'),
    (18, '...........dgtWrrrWtdt..........'),
    (19, '............ggdddd..............'),
    (20, '..........GGgOOBBBbggdd.........'),
    (21, '........gGgdOOBBBBbbgdd.........'),
    (22, '..WLLLLnGGg.OBBBBBbb.gd.........'),
    (23, '.......ngd..nnnonnnn.gd.........'),
    (24, '............OBBBBbbn.Gd.........'),
    (25, '............BBbBBbn..dd.........'),
    (26, '............Ggbbbbgd............'),
    (27, '............Gd...gd.............'),
    (28, '............gd....gd............'),
    (29, '..........Ggd....Ggd............'),
]
GOBLIN_ATTACK = [
    (8, '...........GGGgg................'),
    (9, '..........GGGGgggd..............'),
    (10, '.........GGGGgggggd.............'),
    (11, '...Gg....GGGggggggdd.....gd.....'),
    (12, '...gGGg..GGgggggggdddggggd......'),
    (13, '....gdGGGttgggttggdddgdd........'),
    (14, '........GgYYgggYYgddt...........'),
    (15, '........GgKYgggKYgddt...........'),
    (16, '........GggggGgggggdt...........'),
    (17, '........gggggdggggddt...........'),
    (18, '.........gdWWtWWtddt............'),
    (19, '.........dtrrrrrrtdt............'),
    (20, '........GdgWrrrWtdtdd...........'),
    (21, 'WLLLLnGGGgggddddbbgdd...........'),
    (22, '.....ngdddOOBBBBbb.gd...........'),
    (23, '..........nnnonnnn.Gd...........'),
    (24, '..........OBBBBbbn.dd...........'),
    (25, '.........GBBbBBbn...............'),
    (26, '........Ggbbbbbgd...............'),
    (27, '.......Gd.......gd..............'),
    (28, '......gd.........gd.............'),
    (29, '....Ggd..........Ggd............'),
]


def goblin():
    emit(f'{OUT}/goblin.ts', 'GOBLIN_SPRITE', {'K': 'black', 'G': 'green', 'g': 'midGreen', 'd': 'darkGreen', 't': 'deepTeal', 'Y': 'yellow', 'W': 'white', 'r': 'darkRed', 'O': 'orangeBrown', 'B': 'brown', 'b': 'darkBrown', 'n': 'deepBrown', 'L': 'lightGray', 'M': 'gray', 'o': 'gold'}, frames(GOBLIN, GOBLIN_ATTACK))


GHOST = [
    (6, '............WWWWWL..............'),
    (7, '..........WWWWWWWWLL............'),
    (8, '.........WWWWWWWWWWLL...........'),
    (9, '........WWWWWWWWWWWLLM..........'),
    (10, '........WKKWWWKKWWWWLM..........'),
    (11, '........WKCWWWKCWWWWLM..........'),
    (12, '........WLLWWWLLWWWWLLM.........'),
    (13, '........WWWKKKWWWWWWLLM.........'),
    (14, '.......WWWWAKAWWWWWWLLM.........'),
    (15, '.....WWWWWWWWWWWWWWWLLM.........'),
    (16, '...WWWWLWWWWWWWWWWWWLLM.........'),
    (17, '...LM..WWWWWWWWWWWWWLLM.........'),
    (18, '........WWWWWWWWWWWWWLLM........'),
    (19, '........WWWWWWWWWWWWWLLMM.......'),
    (20, '........WWWWWWWWWWWWWWLLM.......'),
    (21, '.........WWWWWWWWWWWWWLLMM......'),
    (22, '.........WWWWWWWWWWWWWWLLMA.....'),
    (23, '.........WWWL.WWWL.WWLM.MMA.....'),
    (24, '..........WWL..WWL..WLM..MA.....'),
    (25, '...........WL...WL...LM...A.....'),
    (26, '............L....L....M.........'),
]
GHOST_ATTACK = [
    (6, '..........WWWWWL................'),
    (7, '........WWWWWWWWLL..............'),
    (8, '.......WWWWWWWWWWLL.............'),
    (9, '......WWWWWWWWWWWLLM............'),
    (10, '......WKKWWWKKWWWWLM............'),
    (11, '......WKCWWWKCWWWWLM............'),
    (12, '......WLLWWWLLWWWWLLM...........'),
    (13, '......WWKKKKWWWWWWLLM...........'),
    (14, '.C...WWWKKKKWWWWWWLLM...........'),
    (15, 'C.WWWWWWAKKAWWWWWWLLM...........'),
    (16, '.BLLMMWWWWWWWWWWWWLLM...........'),
    (17, 'C....WWWWWWWWWWWWWLLM...........'),
    (18, '.......WWWWWWWWWWWWWLLM.........'),
    (19, '.......WWWWWWWWWWWWWLLMM........'),
    (20, '.......WWWWWWWWWWWWWWLLM........'),
    (21, '........WWWWWWWWWWWWWLLMM.......'),
    (22, '.........WWWWWWWWWWWWWWLLMA.....'),
    (23, '..........WWWL.WWWL.WWLM.MMA....'),
    (24, '...........WWL..WWL..WLM..MA....'),
    (25, '............WL...WL...LM...A....'),
    (26, '.............L....L....M........'),
]


def ghost():
    emit(f'{OUT}/ghost.ts', 'GHOST_SPRITE', {'K': 'black', 'W': 'white', 'L': 'lightGray', 'M': 'gray', 'A': 'slate', 'C': 'cyan', 'B': 'blue'}, frames(GHOST, GHOST_ATTACK))


SPIDER = [
    (8, '.........M...........M..........'),
    (9, '.........A...........A..........'),
    (10, '.........Aa.........aA..........'),
    (11, '....M....Aa.........aA.....M....'),
    (12, '....Aa..A.a.........a.A...aA....'),
    (13, '....Aa..A..a.......a..A...aA....'),
    (14, '...A..a.A..a.......aAAAAAa..A...'),
    (15, '...A...aA..a......AMMaaAAAA.A...'),
    (16, '...A...aA...a....aaaaaaaaAAAA...'),
    (17, '...A....A...a...AaaaaaaaaAAAA...'),
    (18, '...A....AaAAA...AAaaaaaaAAAAA...'),
    (19, '...A...AARaaaAAAAAAAARRRAAAAAA..'),
    (20, '..A....ARaraaaAnnAAAAARAAAAAnA..'),
    (21, '..A....rAAAAAAAAnAAAARRRAAAAnn..'),
    (22, '..A....AAAAAAAAnnAAAAAAAAAAnnA..'),
    (23, '..A....nnnAAAAn...AnAAAAAnnn.A..'),
    (24, '..A....W.Wnnn.......nnnnnnn..A..'),
    (25, '..A....A...............A.....A..'),
    (26, '.A....A.................A.....A.'),
    (27, '.A....A.................A.....A.'),
    (28, '.n....A.................A.....n.'),
    (29, '......n.................n.......'),
]
SPIDER_ATTACK = [
    (5, '........M.......................'),
    (6, '.......Aa.......................'),
    (7, '...M..A..a......................'),
    (8, '...AaA...a...........M..........'),
    (9, '..A.aA...a...........A..........'),
    (10, '..A.Aa....a.........aA..........'),
    (11, '.A.n.a....a.........aA.....M....'),
    (12, '.A....a...a.........a.A...aA....'),
    (13, 'A.....a....a.......a..A...aA....'),
    (14, 'n......a...a.......aAAAAAa..A...'),
    (15, '........a..a......AMMaaAAAA.A...'),
    (16, '........a...a....aaaaaaaaAAAA...'),
    (17, '.........a..a...AaaaaaaaaAAAA...'),
    (18, '.........aAAA...AAaaaaaaAAAAA...'),
    (19, '........ARaaaAAAAAAAARRRAAAAAA..'),
    (20, '........RaraaaAnnAAAAARAAAAAnA..'),
    (21, '.......rAAAAAAAAnAAAARRRAAAAnn..'),
    (22, '........AAAAAAAnnAAAAAAAAAAnnA..'),
    (23, '.......nnnAAAAn...AnAAAAAnnn.A..'),
    (24, '......W..nnnn.......nnnnnnn..A..'),
    (25, '.........W.............A.....A..'),
    (26, '........................A.....A.'),
    (27, '........................A.....A.'),
    (28, '........................A.....n.'),
    (29, '........................n.......'),
]


def spider():
    emit(f'{OUT}/spider.ts', 'SPIDER_SPRITE', {'K': 'black', 'n': 'night', 'A': 'darkSlate', 'a': 'slate', 'M': 'gray', 'R': 'red', 'r': 'darkRed', 'W': 'white'}, frames(SPIDER, SPIDER_ATTACK))


if __name__ == '__main__':
    for name in sys.argv[1:]:
        globals()[name]()
        print('wrote', name)
