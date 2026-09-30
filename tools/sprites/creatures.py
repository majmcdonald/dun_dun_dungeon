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


if __name__ == '__main__':
    for name in sys.argv[1:]:
        globals()[name]()
        print('wrote', name)
