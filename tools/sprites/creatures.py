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


# ------------------------------------------------------------------ Act 1, group 3 enemies

# Skeleton Knight and Cultist: redrawn after an art review.
SKELETON_KNIGHT = [
    (3, '..............RRRr..............'),
    (4, '.............RRRRrrr....W.......'),
    (5, '............MMMAAARrr...WL......'),
    (6, '...........MMAAAAAaarr..WL......'),
    (7, '...........MAAAAAaaa.r..WL......'),
    (8, '..........MMMMAAAaan....WL......'),
    (9, '...........HKWHKaaan....WL......'),
    (10, '...........WLKWLaan.....WL......'),
    (11, '...........WKWKWLan.....WL......'),
    (12, '............LWLMan......WL......'),
    (13, '...MMMMMMMAaMALMMMAAa...WL......'),
    (14, '...MRRRRRrraMMMAAAMMAa..WL......'),
    (15, '...MRRWWWrraMMAAAaAAan..WL......'),
    (16, '...MRWWWLrdaMAAAAaaWL...WL......'),
    (17, '...MRWKWKddaMAAAaaaLWLAMMAAa....'),
    (18, '...MrrWLWddaAAAaaan...MAAAa.....'),
    (19, '...MrrLrLddaAAaOaan.....Bb......'),
    (20, '...Arrrdddda.aWLWan.....Aa......'),
    (21, '....Arrddda.bbBbbbbd............'),
    (22, '....Arrddna.MAAaAAan............'),
    (23, '.....Arddn...WL..LM.............'),
    (24, '.....Addan...WL..LM.............'),
    (25, '......Aan...MAa..Aan............'),
    (26, '.......n....MAa..Aan............'),
    (27, '............MAa..Aan............'),
    (28, '............MAa..aan............'),
    (29, '..........MMAAa.AAan............'),
]
SKELETON_KNIGHT_ATTACK = [
    (0, '............................WL..'),
    (1, '...........................WL...'),
    (2, '..........................WL....'),
    (3, '.............RRRr........WL.....'),
    (4, '............RRRRrrr.....WL......'),
    (5, '...........MMMAAARrr...WL.......'),
    (6, '..........MMAAAAAaarr.WL........'),
    (7, '..........MAAAAAaaa.MWL.........'),
    (8, '.........MMMMAAAaanMAA..........'),
    (9, '..........HKWHKaaabAaM..........'),
    (10, '..........WLKWLaan.WL...........'),
    (11, '..........WKWKWLanWL............'),
    (12, '...........LWLManWL.............'),
    (13, '..MMMMMMMAaMALMMMAAa............'),
    (14, '..MRRRRRrraMMMAAAMMAa...........'),
    (15, '..MRRWWWrraMMAAAaAAan...........'),
    (16, '..MRWWWLrdaMAAAAaa..............'),
    (17, '..MRWKWKddaMAAAaaa..............'),
    (18, '..MrrWLWddaAAAaaan..............'),
    (19, '..MrrLrLddaAAaOaan..............'),
    (20, '..Arrrdddda.aWLWan..............'),
    (21, '...Arrddda.bbBbbbbd.............'),
    (22, '...Arrddna.MAAaAAan.............'),
    (23, '....Arddn....WL..LM.............'),
    (24, '....Addan....WL..LM.............'),
    (25, '.....Aan....MAa..Aan............'),
    (26, '......n.....MAa..Aan............'),
    (27, '............MAa..Aan............'),
    (28, '............MAa..aan............'),
    (29, '..........MMAAa.AAan............'),
]


def skeletonKnight():
    emit(f'{OUT}/skeletonKnight.ts', 'SKELETON_KNIGHT_SPRITE', {'K': 'black', 'W': 'white', 'L': 'lightGray', 'M': 'gray', 'A': 'slate', 'a': 'darkSlate', 'n': 'night', 'H': 'hotRed', 'R': 'red', 'r': 'darkRed', 'd': 'deepBrown', 'B': 'brown', 'b': 'darkBrown', 'O': 'rust'},
         frames(SKELETON_KNIGHT, SKELETON_KNIGHT_ATTACK))


def ghoul_frame(lunge):
    g = Grid()
    dx = -3 if lunge else 0
    def P(x, y, c): g.px(x + dx, y, c)
    def R(x0, y0, x1, y1, c): g.rect(x0 + dx, y0, x1 + dx, y1, c)
    def L(x0, y0, x1, y1, c): g.line(x0 + dx, y0, x1 + dx, y1, c)
    # back arm (in shade) hangs behind
    L(20, 15, 23, 21, 'A'); L(21, 15, 24, 21, 'A'); P(23, 22, 'W'); P(25, 22, 'W')
    R(15, 10, 21, 13, 'M'); R(16, 10, 20, 10, 'L'); R(21, 11, 22, 14, 'A')                   # hunched back
    R(12, 13, 21, 16, 'M'); R(12, 13, 15, 13, 'L')                                            # shoulders
    R(13, 17, 20, 21, 'M'); R(19, 17, 20, 21, 'A')                                            # torso
    for y in (17, 19):                                                                        # ribs
        R(14, y, 18, y, 'a')
    R(13, 22, 20, 23, 'b')                                                                    # loincloth
    L(14, 24, 12, 28, 'M'); L(15, 24, 13, 28, 'M'); R(10, 29, 13, 29, 'A')                   # front leg
    L(19, 24, 20, 28, 'A'); L(20, 24, 21, 28, 'A'); R(19, 29, 22, 29, 'a')                   # back leg
    R(11, 12, 13, 14, 'M')                                                                    # neck
    R(6, 8, 12, 13, 'M'); R(6, 8, 11, 8, 'L'); R(6, 9, 6, 11, 'L'); R(12, 9, 12, 13, 'A')    # head, thrust forward
    R(7, 9, 11, 9, 'a')                                                                       # heavy brow
    P(7, 10, 'Y'); P(10, 10, 'Y')                                                             # eyes
    if lunge:
        R(7, 12, 11, 14, 'r'); P(7, 12, 'W'); P(9, 12, 'W'); P(11, 12, 'W'); P(8, 14, 'W'); P(10, 14, 'W')
        L(14, 13, 10, 4, 'M'); L(15, 13, 11, 4, 'M')                                          # claw raised over its head
        P(8, 3, 'W'); P(9, 2, 'W'); P(10, 2, 'W'); P(12, 2, 'W')
    else:
        R(7, 12, 10, 13, 'r'); P(7, 12, 'W'); P(9, 12, 'W'); P(8, 13, 'W')
        L(13, 17, 8, 23, 'M'); L(14, 17, 9, 23, 'M')                                          # claw hanging from the shoulder
        P(6, 24, 'W'); P(7, 25, 'W'); P(8, 25, 'W')
    return g.outline()


def ghoul():
    emit(f'{OUT}/ghoul.ts', 'GHOUL_SPRITE',
         {'K': 'black', 'M': 'gray', 'L': 'lightGray', 'A': 'slate', 'a': 'darkSlate', 'Y': 'yellow',
          'r': 'darkRed', 'W': 'white', 'b': 'darkBrown'},
         {'idle': ghoul_frame(False), 'attack': ghoul_frame(True)})


CULTIST = [
    (4, '..............PPpp..............'),
    (5, '............PPPpppd.............'),
    (6, '...........PPppppppd............'),
    (7, '..........PPpppppppdd...........'),
    (8, '.........PPpppppppddn...........'),
    (9, '.........pnnnnnpppddn...........'),
    (10, '..........KHKHKppddn.n..........'),
    (11, '..........KKKKKppddn.n..........'),
    (12, '..HR.......KKKpppdn..dn.........'),
    (13, '.HnPr.....PPpppppppddn..........'),
    (14, '.rnnr....PPPpppppppdn...........'),
    (15, '..rr..PPpp.Ppppppppdn...........'),
    (16, '...SspppddPpppppppppdn..........'),
    (17, '..SS.ddn..Ppppppppppdn..........'),
    (18, '..........Ppppppppppdn..........'),
    (19, '..........RRRRRRRRRRrdn.........'),
    (20, '..........rrrrrrrrrrdsS.........'),
    (21, '..........PRrPdppdpddnL.........'),
    (22, '.........PpRrPdppdppddL.........'),
    (23, '.........PprpPdpppdpddM.........'),
    (24, '.........Ppprdppppddddn.........'),
    (25, '........PpppPdppppdpdddn........'),
    (26, '........PpppPdppppdpdddn........'),
    (27, '........PppPdpppppdpdddn........'),
    (28, '.......rRRRRRrrrrrrrrrrd........'),
    (29, '.........nnd...nn...............'),
]
CULTIST_ATTACK = [
    (4, '..............PPpp..............'),
    (5, '............PPPpppd.............'),
    (6, '..H........PPppppppd............'),
    (7, '.HHR.r....PPpppppppdd...........'),
    (8, 'HnPnR....PPpppppppddn...........'),
    (9, 'HnnnrR...pnnnnnpppddn...........'),
    (10, 'Rnnnr.....KHKHKppddn.n..........'),
    (11, '.rrr.SsPPPpKKKKppddn.n..........'),
    (12, '....SSpppddKKKpppdn..dn.........'),
    (13, '........ddPPpppppppddn..........'),
    (14, '...........Ppppppppdn...........'),
    (15, '...........Ppppppppdn...........'),
    (16, '..........Ppppppppppdn..........'),
    (17, '..........Ppppppppppdn..........'),
    (18, '..........Ppppppppppdn..........'),
    (19, '..........RRRRRRRRRRrdn.........'),
    (20, '..........rrrrrrrrrrdsS.........'),
    (21, '..........PRrPdppdpddnL.........'),
    (22, '.........PpRrPdppdppddL.........'),
    (23, '.........PprpPdpppdpddM.........'),
    (24, '.........Ppprdppppddddn.........'),
    (25, '........PpppPdppppdpdddn........'),
    (26, '........PpppPdppppdpdddn........'),
    (27, '........PppPdpppppdpdddn........'),
    (28, '.......rRRRRRrrrrrrrrrrd........'),
    (29, '.........nnd...nn...............'),
]


def cultist():
    emit(f'{OUT}/cultist.ts', 'CULTIST_SPRITE', {'K': 'black', 'P': 'magenta', 'p': 'plum', 'd': 'deepBrown', 'n': 'night', 'R': 'red', 'r': 'darkRed', 'H': 'hotRed', 'S': 'skin', 's': 'skinShade', 'L': 'lightGray', 'M': 'gray'}, frames(CULTIST, CULTIST_ATTACK))


# ------------------------------------------------------------------ Act 1 Epic Monsters (drawn by the art reviewer)
OGRE = [
    (4, '..............dd................'),
    (5, '.............SSsss..............'),
    (6, '........SSSbSSsssssbssB.........'),
    (7, '.....SSSSssbSbbsbbBbsssssB......'),
    (8, '....SSSSsssbsRbsRbBbssssssBB....'),
    (9, '...SSSsssssbSsBBBsBbsssssssBB...'),
    (10, '..SSsssssBbbsWKKKWBbssssssBBb...'),
    (11, '..SssssBbSSSbBsssBbsssbSsssBBb..'),
    (12, '..SssssBbSSdWdddWdsssBbsssssBb..'),
    (13, '..SsssBbbsBBWsssWsBBBsbssssBBb..'),
    (14, '.SSsssBbbSSssssssssssBbSsssBBb..'),
    (15, '.SSSssBbbSsssssssssssBbSssssBb..'),
    (16, '.sBsBsBbbssssssBssssBBbsssssBb..'),
    (17, '.bBbBbbbbsssssssssssBBbssssBBb..'),
    (18, '...bdn..bBsssssssssBBbbssssBBb..'),
    (19, '...bdn..ddddddddYdddddbSSssBBb..'),
    (20, '...bdn...AAaaaaaaaaaan.sBsBsBb..'),
    (21, '..bbdn...Aaaaaaaaaaann.bBbBbbb..'),
    (22, '..bbddn..SAaaaaaaaaanB..........'),
    (23, '.Lbbddn..SsssAaaansssBb.........'),
    (24, '.bbLddnL.sssBaaaanssBBb.........'),
    (25, '.bbbddnn.sssBbaanbsssBb.........'),
    (26, '.LbbdddM.sSssBb..sSssBb.........'),
    (27, '.bbbdMnn.sssBBb..sssBBb.........'),
    (28, '.bLbddnnSSsssBb.SSsssBb.........'),
    (29, '..dddnn.BBBBbbb.BBBBbbb.........'),
]
OGRE_ATTACK = [
    (1, '..SSssB.......LbbbLbbbbLbbbbd...'),
    (2, '.SSsssBbbbbbBbbbbbbbbbbbbbbdn...'),
    (3, '.sBsBsbddddddbdddddddddddddnn...'),
    (4, '..SssBb.......ndnnMnnnnnMnnnn...'),
    (5, '..SssBb......SSsss..............'),
    (6, '..SsssBbSSSbSSsssssbssB.........'),
    (7, '..SssssBsssbSbbsbbBbsssssB......'),
    (8, '..SssssssssbsRbsRbBbssssssBB....'),
    (9, '..sssssssssbSsBBBsBbsssssssBB...'),
    (10, '..BsssssssBbsWKrKWBbssssssBBb...'),
    (11, '.....BbbbSSSbBsssBbsssbSsssBBb..'),
    (12, '........bSSdWdddWdsssBbsssssBb..'),
    (13, '........bsBBWsssWsBBBsbssssBBb..'),
    (14, '........bSSssssssssssBbSsssBBb..'),
    (15, '........bSsssssssssssBbSssssBb..'),
    (16, '........bssssssBssssBBbsssssBb..'),
    (17, '........bsssssssssssBBbssssBBb..'),
    (18, '........bBsssssssssBBbbssssBBb..'),
    (19, '........ddddddddYdddddbSSssBBb..'),
    (20, '.........AAaaaaaaaaaan.sBsBsBb..'),
    (21, '.........Aaaaaaaaaaann.bBbBbbb..'),
    (22, '.........SAaaaaaaaaanB..........'),
    (23, '.........SsssAaaansssBb.........'),
    (24, '.........sssBaaaanssBBb.........'),
    (25, '.........sssBbaanbsssBb.........'),
    (26, '.........sSssBb..sSssBb.........'),
    (27, '.........sssBBb..sssBBb.........'),
    (28, '........SSsssBb.SSsssBb.........'),
    (29, '........BBBBbbb.BBBBbbb.........'),
]


def ogre():
    emit(f'{OUT}/ogre.ts', 'OGRE_SPRITE', {'K': 'black', 'S': 'sand', 's': 'tan', 'B': 'brown', 'b': 'darkBrown', 'd': 'deepBrown', 'n': 'night', 'A': 'slate', 'a': 'darkSlate', 'L': 'lightGray', 'M': 'gray', 'W': 'white', 'R': 'red', 'r': 'darkRed', 'Y': 'gold'},
         frames(OGRE, OGRE_ATTACK))


SPIDER_QUEEN = [
    (2, '................................'),
    (3, '................................'),
    (4, '....M...............MMMMM.......'),
    (5, '...aa.............MMMaaaMMa.....'),
    (6, '...a.a...........MMaaaaaaaaA....'),
    (7, '..a..a..........MLMaaaaaaaAAA...'),
    (8, '..a..a.........MLaaaaaaaaAAAAA..'),
    (9, '.a...a.........MaaaaaaaaAAAAAA..'),
    (10, '.n....a.......MMaaaaaaaAAAAAAAA.'),
    (11, '......a.y.y.y.MaaaaaaaaAAAAAAAA.'),
    (12, '......a.YYYYO.MaaaaaaaaAAAAAAAn.'),
    (13, '.......aORYRO.MaaaaAaaaAAAAAAnn.'),
    (14, '......MMMMMMaanaaaAAAaAAAAAAnnn.'),
    (15, '.....MaHaHaaaAnaAAAAAAAAAAAnnnn.'),
    (16, '.....MHaaaaaAAnAAAAAAAAAAnnnnnn.'),
    (17, '.....aaaaaaAAAnAAAAAAAAAnnnnnn..'),
    (18, '.....aaaaAAAAnnAAAAAAAAnnnnnnn..'),
    (19, '....aaAaAAAnnnn.AAAAAAnnnnnnn...'),
    (20, '....AAnAAnnnnn...AAAnnnnnnnnAa..'),
    (21, '....rnrAnnnnn.a..aAnnnnannn..M..'),
    (22, '....W.Wa.nn...a...a.nnnna.....L.'),
    (23, '....G.La.A....a...a...A..aa.....'),
    (24, '....g.a..A...a.....a..A....M....'),
    (25, '......M.A....a.....M...a...a....'),
    (26, '......a.a....M.....a....A...a...'),
    (27, '.....a..A....a......a...A...a...'),
    (28, '.....a.A....a.......a....A...a..'),
    (29, '.....n.n....n.......n....n...n..'),
]
SPIDER_QUEEN_ATTACK = [
    (1, '......nAA.......................'),
    (2, '...M.....AAa....................'),
    (3, '..aa.......A....................'),
    (4, '..a.a......A........MMMMM.......'),
    (5, '.a..a.......A.....MMMaaaMMa.....'),
    (6, '.n..a.......A....MMaaaaaaaaA....'),
    (7, '.....a......A...MLMaaaaaaaAAA...'),
    (8, '.....a..y.y.yA.MLaaaaaaaaAAAAA..'),
    (9, '.....a..YYYYOA.MaaaaaaaaAAAAAA..'),
    (10, '......a.ORYROAMMaaaaaaaAAAAAAAA.'),
    (11, '......MMMMMMaanaaaaaaaaAAAAAAAA.'),
    (12, '.....MaHaHaaaAnaaaaaaaaAAAAAAAn.'),
    (13, '.....MHaaaaaAAnaaaaAaaaAAAAAAnn.'),
    (14, '.g...aaaaaaAAAnaaaAAAaAAAAAAnnn.'),
    (15, '.gG.aaaaaAAAAnnaAAAAAAAAAAAnnnn.'),
    (16, '.G.GAaAaAAAnnnnAAAAAAAAAAnnnnnn.'),
    (17, '.GgGrnrAAnnnnn.AAAAAAAAAnnnnnn..'),
    (18, '..GGW.W.nnnnn..AAAAAAAAnnnnnnn..'),
    (19, '.Gg.L....nn.A...AAAAAAnnnnnnn...'),
    (20, '.g......a...A.a..AAAnnnnnnnnAa..'),
    (21, '........a...A.a..aAnnnnannn..M..'),
    (22, '..G.....a..A..a...a.nnnna.....L.'),
    (23, '.......a...A...a..a...A..aa.....'),
    (24, '.......M...A...a...a..A....M....'),
    (25, '.......a...a...M...M...a...a....'),
    (26, '.......a...A...a...a....A...a...'),
    (27, '......a...A...a.....a...A...a...'),
    (28, '......a...A...a.....a....A...a..'),
    (29, '......n...n...n.....n....n...n..'),
]


def spiderQueen():
    emit(f'{OUT}/spiderQueen.ts', 'SPIDER_QUEEN_SPRITE', {'K': 'black', 'n': 'night', 'A': 'darkSlate', 'a': 'slate', 'M': 'gray', 'R': 'red', 'r': 'darkRed', 'W': 'white', 'L': 'lightGray', 'H': 'hotRed', 'G': 'green', 'g': 'midGreen', 'Y': 'gold', 'y': 'yellow', 'O': 'orange'},
         frames(SPIDER_QUEEN, SPIDER_QUEEN_ATTACK))


BONE_MAGE = [
    (1, '..L.C.M.....AAaa.n..............'),
    (2, '..LCWCM...AAAaaaann.............'),
    (3, '..LCCBM..AAaaaaaann.............'),
    (4, '..MBBbM..AWWWWWWLnan............'),
    (5, '...WLM...aWWWWWLMnaan...........'),
    (6, '....LM....HKWHKLMnaan...........'),
    (7, '....LM....KKWKKLMnaann..........'),
    (8, '....LM....WWKWLMMnaann..........'),
    (9, '....LM.....KWKWKMnaann..........'),
    (10, '....LM.....LWLWMnaaann..........'),
    (11, '....LM...aAaLMaaaaann...........'),
    (12, '...WLM..AAaanLWnaaann...........'),
    (13, '...WLWLAAAaanWLWnaaKnn..........'),
    (14, '...LMLMAaaaanKKKnaaKnn..........'),
    (15, '....LMAaaannLWLnaaKann..........'),
    (16, '....LMaaannAnKnaaaKann..........'),
    (17, '....LMnnnAaaaaaaaaKann..........'),
    (18, '....LM..arrrrrLrrrrrrnn.........'),
    (19, '....LM..AAaaaKaaaaaKann.........'),
    (20, '....LM.AAaaaaKaaaaaKann.........'),
    (21, '....LM.AAaaaKaaaaaaaKann........'),
    (22, '...WLMAAaaaaKaaaaaaaKann........'),
    (23, '....LMAAaaaKaaaaaaaaKaann.......'),
    (24, '....LMAaaaaKaaaaaaaaKaan........'),
    (25, '....LMAaaaKaaaaaaaaaKaann.......'),
    (26, '....LMaaaaKaaaaaaaaaKaann.......'),
    (27, '....LMaaaKaaaaaaaaaaKaan.n......'),
    (28, '....LM.aaKnb.aaaanb.aKnbn.......'),
    (29, '....LM..b..b...b...b..b.........'),
]
BONE_MAGE_ATTACK = [
    (1, '.....L.C.M......AAaa.n..........'),
    (2, '.....LCWCM....AAAaaaann.........'),
    (3, '.....LCCBM...AAaaaaaann.........'),
    (4, '.....MBBbM...AWWWWWWLnan........'),
    (5, '......WLM....aWWWWWLMnaan.......'),
    (6, '....p..LM.....HKWHKLMnaan.......'),
    (7, '..bBp..LM.....KKWKKLMnaann......'),
    (8, '.bCCB...LM....WWKWLMMnaann......'),
    (9, '.CWWCb..LM.....KWKWKMnaann......'),
    (10, '.CWWCBp.LM.....LWLWMnaaann......'),
    (11, '.bCCBp..LM...aAaLMaaaaann.......'),
    (12, '..bp.....LAAaAaanLWnaaann.......'),
    (13, '.......WLWLAaaaanWLWnaaKnn......'),
    (14, '.......LMLMaanaanKKKnaaKnn......'),
    (15, '.........LMaaannLWLnaaKann......'),
    (16, '.........nLMannAnKnaaaKann......'),
    (17, '..........LMnAaaaaaaaaKann......'),
    (18, '..........LMarrrrrLrrrrrrnn.....'),
    (19, '..........LMAAaaaKaaaaaKann.....'),
    (20, '...........LMaaaaKaaaaaKann.....'),
    (21, '...........LMaaaKaaaaaaaKann....'),
    (22, '..........WLMaaaKaaaaaaaKann....'),
    (23, '..........ALMaaKaaaaaaaaKaann...'),
    (24, '.........AAaLMaKaaaaaaaaKaan....'),
    (25, '.........AAaLMKaaaaaaaaaKaann...'),
    (26, '........AAaaLMKaaaaaaaaaKaann...'),
    (27, '........AAaaLMaaaaaaaaaaKaan.n..'),
    (28, '........Ab.aaLMb.aaaanb.aKnbn...'),
    (29, '........b...bLMb...b...b..b.....'),
]


def boneMage():
    emit(f'{OUT}/boneMage.ts', 'BONE_MAGE_SPRITE', {'K': 'black', 'W': 'white', 'L': 'lightGray', 'M': 'gray', 'H': 'hotRed', 'r': 'darkRed', 'A': 'slate', 'a': 'darkSlate', 'n': 'night', 'C': 'cyan', 'B': 'blue', 'b': 'navy', 'p': 'plum'},
         frames(BONE_MAGE, BONE_MAGE_ATTACK))


# ------------------------------------------------------------------ Act 1 bosses (48x48, drawn by the art reviewer)
BOSS_SIZE = 48


def boss_frame(rows):
    """48x48 version of sprite(): fill rows, then the same single black outline rule as Grid.outline()."""
    g = [['.'] * BOSS_SIZE for _ in range(BOSS_SIZE)]
    for y, line in rows:
        assert len(line) == BOSS_SIZE, (y, len(line))
        g[y] = list(line)
    out = [r[:] for r in g]
    for y in range(BOSS_SIZE):
        for x in range(BOSS_SIZE):
            if g[y][x] != '.':
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < BOSS_SIZE and 0 <= ny < BOSS_SIZE and g[ny][nx] not in '.K':
                    out[y][x] = 'K'
                    break
    return [''.join(r) for r in out]


def emit_boss(name, const, legend, idle_rows, attack_rows):
    frames = {'idle': boss_frame(idle_rows), 'attack': boss_frame(attack_rows)}
    used = set(''.join(''.join(f) for f in frames.values())) - {'.'}
    assert not used - set(legend), (const, used - set(legend))
    out = ["import type { SpriteDef } from '../sprite';", '', f'export const {const}: SpriteDef = {{',
           f'  width: {BOSS_SIZE},', f'  height: {BOSS_SIZE},', '  legend: {']
    out += [f"    {k}: '{v}'," for k, v in legend.items() if k in used]
    out += ['  },', '  frames: {']
    for frame, rows in frames.items():
        out.append(f'    {frame}: [')
        out += [f"      '{r}'," for r in rows]
        out.append('    ],')
    out += ['  },', '};', '']
    open(f'{OUT}/{name}.ts', 'w').write('\n'.join(out))


GOBLIN_KING = [
    (1, '...............Y................................'),
    (2, '...............YO....Y..........................'),
    (3, '...............YoO..YoO....Y....................'),
    (4, '...............YooOYYoO...YO....................'),
    (5, '...............YoooooooOYYoO....................'),
    (6, '...............YRroYoooooooO....................'),
    (7, '......G.......GxxxxxCcoYRooO...........d........'),
    (8, '......GGg....GGGGGGGxxxxxroOd........ddg........'),
    (9, '.......GGgg..GGGGGGggggggxxxdd.....ddggd........'),
    (10, '........gGGggGGGGGggggggggddddd..ddgggd.........'),
    (11, '.........ddgGGGtttttggttttgdddddgggdd...........'),
    (12, '.....Y....ddGGKYYYdggKYYYddddtdddd..............'),
    (13, '...YYoOO...GGgKKYYdggKKYYgddddt.................'),
    (14, '..YooooOOGGGGgdgggggGggggggdddt.................'),
    (15, '..YoRRroOGGggdggggggggggggggddt.................'),
    (16, '.YYoRrroOxtgddgdggggggggggggddt.................'),
    (17, '..YoorroOdddgtWWtWWtWWtWWtggdt..................'),
    (18, '..OooooOx...dtWrrrrrrrrrrWtddt..................'),
    (19, '...OOxxx....ddtWtWttWtttWtddt...................'),
    (20, '.....xO......ddddddddddddddtWWWWWMRRe...........'),
    (21, '.....oO......WWWWWWWWWWWWWWWWWWWWWWWWM..........'),
    (22, '......oO....MWGWtWWWWWWWWWWWKWWWWWWWWMM.........'),
    (23, '......oO....RGGGtWWWWWKWWWWWWWWWWWKWMMt.........'),
    (24, '......YO....GGggtMWKMMWMMKWMMMWKMMMMMgt.........'),
    (25, '.......oO..RGgggtGMMGGMMGGMMggMMddMGgggt........'),
    (26, '.......oO..GGgggtGGGGGGGGGGggggggddGgggt........'),
    (27, '.......oO..GgggttGGGGGGGGGGgggggggddtgggt.......'),
    (28, '........oOGGgggtGGGGGGGGGGGGggggggddtgggt.......'),
    (29, '........oGGGggttGGGGGGGGGGGggggggggddtgggt......'),
    (30, '........GGggGttgGGGGGGGGGGGggggggggddtgggt......'),
    (31, '.......GdddddtgggGGGGGGGGGggggggggdddtgggt......'),
    (32, '........GggtttgggggGGGGGggggggggggdddtGggt......'),
    (33, '.........tttrGdgggggggggdtgggggggdddttooooo.....'),
    (34, '.........RoOrrGdggggggggggggggggddddtrOOOOO.....'),
    (35, '........RRoOrrGddggggggYYYoggggddddttrGggt......'),
    (36, '........RrYOrrrYYYYYYYYoxxoOYYYYYYYxrrGGGGt.....'),
    (37, '........RrroOrrYooooooYxRrxOooooooxxrrGGggG.....'),
    (38, '.......RRrroOrrrxxxxxxxOOOxxxxxxxxxrrGGgggtt....'),
    (39, '.......RrrroOrrrxBBBBBBBBbBBBBBBbeerrrGggtt.....'),
    (40, '.......RrrrroOrrrxBBBBBBBbBBBBBbberrrrrttte.....'),
    (41, '......RRrrrxxrrrrxbbbbbbbbbbbbbbeerrrrrreee.....'),
    (42, '......RrrrrrrrrrrGeeeeeeebeeeeeeerrrrrrreee.....'),
    (43, '......ReeeeeeeeeeGgggteeeeeeGgggteeeeeeeeee.....'),
    (44, '.....RReeeeeeeeGGGGGGteeeeGGGGGGteeeeeeeeeee....'),
    (45, '.....LLLLLLLLLLGgggggtLLLLGgggggtLLLLLLLLLLL....'),
    (46, '...............ttttttt....ttttttt...............'),
]
GOBLIN_KING_ATTACK = [
    (2, '.............Y..................................'),
    (3, '.............YO....Y............................'),
    (4, '.............YoO..YoO....Y......................'),
    (5, '.............YooOYYoO...YO......................'),
    (6, '.............YoooooooOYYoO..............GG......'),
    (7, '.............YRroYoooooooO.............GGgG.....'),
    (8, '....G.......GxxxxxCcoYRooO...........ddddddt....'),
    (9, '....GGg....GGGGGGGxxxxxroOd........ddgGggggt....'),
    (10, '.....GGgg..GGGGGGggggggxxxdd.....ddggddddddt....'),
    (11, '......gGGggGGGGGggggggggddddd..ddgggd.GGgtt.....'),
    (12, '.......ddgGGGGtttggggtttgdddddgggdd...Ggttt.....'),
    (13, '........ddGtKYYYtggtKYYYdddtdddd......Gggt......'),
    (14, '.........GGgdKKYdggdKKYgddddt.........ooooo.....'),
    (15, '.......GGGGgdgggggGggggggdddt.........OOOOO.....'),
    (16, '......GGGggdggggggggggggggddt.........Gggt......'),
    (17, '.....GGgtgdtKKKKKKKKKKKKKgddt........GGggt......'),
    (18, '......ddddtKWWKWWKWWKWWKKtdt........GGgggt......'),
    (19, '..........tKKKrrrrrrrrKKKtdt........Ggggtt......'),
    (20, '..........dtKrrRRRRRrrrKtdtWWWWWWMRGGgggt.......'),
    (21, '..........ddtKWWKKKKWWKtddtWWWWWWWWWWMgtt.......'),
    (22, '.....Y.....dddttttttttdddtWWKWWWWWWWWMMt........'),
    (23, '...YYoOO....RMWWWWWWWWKWWWWWWWWWWWKWMMtt........'),
    (24, '..YooooOO...RrGGGGtKMMWMMKWMMMWKMMMMMgt.........'),
    (25, '..YoRRroO..RRrrGggtMGGMMGGMMggMMddMggtt.........'),
    (26, '.YYoRrroOxYYrrGGGgtGGGGGGGGggggggddGtte.........'),
    (27, '..YoorroOxooYGGggGtGGGGGGGGgggggggddtee.........'),
    (28, '..OooooOx.xxGGgggttGGGGGGGGGggggggddtee.........'),
    (29, '...OOxxx..RrrGggtttGGGGGGGGggggggggddtee........'),
    (30, '.....x....RrrGtttttGGGGGGGGggggggggddtee........'),
    (31, '.........RRrrGgggGGGGGGGGGggggggggdddtee........'),
    (32, '.........RrrrGgggggGGGGGggggggggggdddtee........'),
    (33, '.........RrrrGdgggggggggdtgggggggdddtteee.......'),
    (34, '.........RrrrrGdggggggggggggggggddddtreee.......'),
    (35, '........RRrrrrGddggggggYYYoggggddddttreee.......'),
    (36, '........RrrrrrrYYYYYYYYoxxoOYYYYYYYxrreee.......'),
    (37, '........RrrrrrrYooooooYxRrxOooooooxxrrreee......'),
    (38, '.......RRrrrrrrrxxxxxxxOOOxxxxxxxxxrrrreee......'),
    (39, '.......RrrrrrrrrxBBBBBBBBbBBBBBBbeerrrreee......'),
    (40, '.......RrrrrrrrrrxBBBBBBBbBBBBBbberrrrrreee.....'),
    (41, '......RRrrrrrrrrrxbbbbbbbbbbbbbbeerrrrrreee.....'),
    (42, '......RrrrrrrrrrrGeeeeeeebeeeeeeerrrrrrreee.....'),
    (43, '......ReeeeeeeeeeGgggteeeeeeGgggteeeeeeeeee.....'),
    (44, '.....RReeeeeeeeGGGGGGteeeeGGGGGGteeeeeeeeeee....'),
    (45, '.....LLLLLLLLLLGgggggtLLLLGgggggtLLLLLLLLLLL....'),
    (46, '...............ttttttt....ttttttt...............'),
]


def goblinKing():
    emit_boss('goblinKing', 'GOBLIN_KING_SPRITE', {'B': 'brown', 'C': 'cyan', 'G': 'green', 'K': 'black', 'L': 'lightGray', 'M': 'gray', 'O': 'orange', 'R': 'red', 'W': 'white', 'Y': 'yellow', 'b': 'darkBrown', 'c': 'blue', 'd': 'darkGreen', 'e': 'deepBrown', 'g': 'midGreen', 'o': 'gold', 'r': 'darkRed', 't': 'deepTeal', 'x': 'orangeBrown'}, GOBLIN_KING, GOBLIN_KING_ATTACK)


SLIME_KING = [
    (2, '...............................Y................'),
    (3, '........................Y.....YO................'),
    (4, '.................Y.....YoO...YoO................'),
    (5, '.................YO....YoO...YoO................'),
    (6, '.................YoO...ooOO..ooO................'),
    (7, '.................YoO..YoooOOYooO................'),
    (8, '.................YooOYoooooooooO................'),
    (9, '.................YoooooooooooRrO................'),
    (10, '.................YoooooCcoooouoO................'),
    (11, '.................YRrooYccooooooO................'),
    (12, '.................Yrroooooooooxxx................'),
    (13, '.................YoooooxxxxxxGGG................'),
    (14, '................GxxxxxxGGGGGGGGG................'),
    (15, '..............GGGGWGGWGGGGGGGGGGgd..............'),
    (16, '............GGGGGGGGGGGGGGGGGGGGGGgd............'),
    (17, '...........GGGGGGGGGGGGGGGGGGGGGGGGgd...........'),
    (18, '..........GGWWGGGGGGGGGGGGGGGGGGGGGGgd..........'),
    (19, '.........GGWGGGGGGGGGGGGGGGGGGGGGGGGGgd.........'),
    (20, '........GGWGGGGGGGGGGGGGGGGGGGGGGGGGGGgd........'),
    (21, '.......GGWGGGGGGGGGGGGGGGGGGGGGGGGGGGGGgd.......'),
    (22, '.......GWGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGgd.......'),
    (23, '......GWGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGgd......'),
    (24, '......GWddGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGgd......'),
    (25, '.....GWGddddGGGGGGGGGGGGddGGGGGGGGGGGGGGGgd.....'),
    (26, '.....GWGGddddddGGGGGGGddddGGGGGGGGGGGGGGGgd.....'),
    (27, '.....GGGGGGGddddGGGGdddddGGGoGGGGGGGGGGGGgd.....'),
    (28, '....GGWGGGGGGGddGGGddddGGGGGGeGGbGGGGGGGGGgd....'),
    (29, '....GGWGGGWWKKGGGGGddGGGGGGGGGebGGGGGGGGGGgd....'),
    (30, '....GGGGGGKKKKGGGGGGWWKKGGggggbLLggggGGGGGgd....'),
    (31, '....GGGGGGKKKKGGGGGGKKKKgggggbgLMLgggggGGGgd....'),
    (32, '...GGGGGGGGGGGGGGGGGKKKKggggggggLMLggggggYYgd...'),
    (33, '...GGGGGGGGGGGGGGGGGGggggggggggggLMLggggYoood...'),
    (34, '...GGGGGGGGGGGGGGGGGggggggggggggggLMLgggYooOd...'),
    (35, '...GGGGGGGGGGGKKKKKKgggggggggggggggLMLgggOOgd...'),
    (36, '...GGGGGGGGGGKGggggGKgGgggggggggggggSSSgggggd...'),
    (37, '...GGGGGGGGGKGGGGGGggKgggggggggggggSSSSsggggd...'),
    (38, '...GGGGGGGGGGGGGGGGGgggggggggggggggSKSKsggggd...'),
    (39, '...GGGGGGGGGGGGGGGGGggggggggggggggggSSsgggggd...'),
    (40, '...GGGGGGGGGGGGGGGGSSgggggggSSggggggsgsgggggd...'),
    (41, '...GGGGGGGGGGGGGGGGGSSSSSSSSsgggggggggggggGgd...'),
    (42, '...GGGGGGGGGGGGGGGGssGggggggssgggGgggggggGGgd...'),
    (43, '...GGGGGGGGGGGGGGGGGGGGGgggggggggggggggGGGGgd...'),
    (44, '..gggggggggggggggggggggggggggggggggggggggggggg..'),
    (45, '..dddddddddddddddddddddddddddddddddddddddddddd..'),
    (46, '.dddddddddddddddddddddddddddddddddddddddddddddd.'),
]
SLIME_KING_ATTACK = [
    (2, '.............................Y..................'),
    (3, '......................Y.....YO..................'),
    (4, '...............Y.....YoO...YoO..................'),
    (5, '...............YO....YoO...YoO..................'),
    (6, '...............YoO..YooOOOYooO..................'),
    (7, '...............YoO..ooooOooooO..................'),
    (8, '...............YooOYoooooooooO..................'),
    (9, '...............YoooooooooooRrO..................'),
    (10, '...............YooooYCcoooouoO..................'),
    (11, '...............YRroooccooooooO..................'),
    (12, '...............Yrrooooooo.......................'),
    (13, '...............Yoooo............................'),
    (15, '.........WG.........................WG..........'),
    (16, '.........Gg.........................Gg..........'),
    (19, '.....WG.........................................'),
    (20, '.....Gg...................................WG....'),
    (21, '..........................................Gg....'),
    (23, '..................GGGGGGGGGGgd..................'),
    (24, '...............GGGGGGGGGGGGGGGGgd...............'),
    (25, '..WG..........GGGGGGGGGGGGGGGGGGgd..............'),
    (26, '..Gg........GGGGGGGGGGGGGGGGGGGGGGgd.........WG.'),
    (27, '..........WWGGGGGGGGGGGGGGGGGGGGGGGgd........Gg.'),
    (28, '.......ddWGGGGGGGGGGGGddGGGGGGGGGGGGgd..........'),
    (29, '.......ddddGGGGGGGGGddddGGGGGGGGGGGGGgd.........'),
    (30, '.......WdddddGGGGGdddddGGGGGGGGGGGGGGGgd........'),
    (31, '......WGGGddddGGGddddGGGGGGGGGGGGGGGGGGgd.......'),
    (32, '.....W.GGWWKKdGGGdWWKKGGGGGGGGGGGGGGGGGgd.......'),
    (33, '.....WGGGKKKKGGGGGKKKKGGGGGGGGGGGGGGGGGGgd......'),
    (34, '....WGGGGGGGGGGGGGGGGGGGGGbggggggggggGGGGgd.....'),
    (35, '....WGGGGGGGGGGGGGGGGGGgoebLLLLLLLLLggggGgd.....'),
    (36, '....GGGGGGGGWKKKKKWGGgggggbMMMMMMMMggggggSSS....'),
    (37, '...WGGGGGGGGKKKKKKKgggggggggggggggggggggSSSSs...'),
    (38, '...WGGGGGGGKKKKKKKKKgggggggggggSSgggggggSKSKs...'),
    (39, '...GGGGGGGGKKKKrKKKKgggYYgggggggSSSSSSSSsSSsd...'),
    (40, '...GGGGGGGGGrrrrrrrgggYooogggggssgggggggssgsd...'),
    (41, '...GGGGGGGGGGRRRrrGgggYooOggggggggggggggggggd...'),
    (42, '.d.GGGGGGGGGGGGGGGGGGggOOgggggggggggggggggGgd.d.'),
    (43, '.d.GGGGGGGGGGGGGGGGGGGGgggggggggggggggggGGGgd.d.'),
    (44, '..gggggggggggggggggggggggggggggggggggggggggggg..'),
    (45, '.dddddddddddddddddddddddddddddddddddddddddddddd.'),
    (46, '.dddddddddddddddddddddddddddddddddddddddddddddd.'),
]


def slimeKing():
    emit_boss('slimeKing', 'SLIME_KING_SPRITE', {'C': 'cyan', 'G': 'green', 'K': 'black', 'L': 'lightGray', 'M': 'gray', 'O': 'orange', 'R': 'red', 'S': 'sand', 'W': 'white', 'Y': 'yellow', 'b': 'darkBrown', 'c': 'blue', 'd': 'darkGreen', 'e': 'deepBrown', 'g': 'midGreen', 'o': 'gold', 'r': 'darkRed', 's': 'tan', 'u': 'rust', 'x': 'orangeBrown'}, SLIME_KING, SLIME_KING_ATTACK)


TROLL = [
    (1, '........................................gg......'),
    (2, '......................................Gg........'),
    (3, '.......................................g........'),
    (4, '.........................MMMMMMMMMuu...xg.......'),
    (5, '........................MMAGGGGGAuxxg.xBBBBb....'),
    (6, '......................MMGGGGggggGGGSGxBBebbe....'),
    (7, '.............b...b..bnMGGgggggggggddKxBBBbBb....'),
    (8, '............bBb.bBbbBbnMdddggggddGGGAxxBBBBbe...'),
    (9, '...........bBBBbBBBBBbnMMMMdddddGGgddBBBBbbee...'),
    (10, '..........bBBBBBBBBBbbbnMMMMMMMMMdddGxBBBbe.....'),
    (11, '.........bBBMMMBBBbbbbenMMMMMMMMAAAAGxBBBbe.....'),
    (12, '.........MMMAAAMBbbbbeenAAMAAAAAAAAAxBBBBbe.....'),
    (13, '........MMAAAAAAMbbbeeenAAAAAAAAAAAAxBBbbe......'),
    (14, '.......MMMMMMMAAAAbbeeenAAAAAAAAAAAAxBBBbe......'),
    (15, '.......MAnnnnnAAAAAMAeennAAAAAAAAAAAKxBBbe......'),
    (16, '.......MAnYKnAAAAAMMAaennnAAAAAAAAaaxBbeeK......'),
    (17, '......MMAAnnAAAAAAAMAAannnAAAAAAAaaaxBbeKn......'),
    (18, '.....MMAAAAAAAAAAAAaAaannnnAAAAAaaaaxBbeKnn.....'),
    (19, '....MMAAAAAAAAAAAAAAaaannnAAAAaaaaaxxBbeKnn.....'),
    (20, '...MMAAAAnAAAAAAAAAAaannnnAAAaaaaaaxBbeKann.....'),
    (21, '...MAAAAnnaAAAAAAAAAaannnAAAaaaaaaaxBbeKnnn.....'),
    (22, '...nAAAnn..aAAAAAAAaannnAAaaaaaaaaaxBbeKnan.....'),
    (23, '....nnn.SAnnnnnnAAAaannAAaaaaaaaaaxBbeKanan.....'),
    (24, '.......MASAAAAASAAaaannAaaaaaaaaaaaaaannnnn.....'),
    (25, '.......MAAAAAAAAAAaannnaaaaaaaaaaaaaaannan......'),
    (26, '...g....naaaaaaaaannnnaaaaaaaaaaaaaaaannnn......'),
    (27, '..gGg......nnnnnnnnnnaaaaaaaaaaaaaaaaannn....g..'),
    (28, '...g.......MAAAAaannnaaaaaaaaaaaaannnnnnn...gGg.'),
    (29, '..........MMAAAAAAn.MaaaaaaaaaaaaaKKaann.....g..'),
    (30, '..........MAAAAAAAnneeeeeeeeSLeeeeeeeeeee.......'),
    (31, '..........MAAAAAAAnnBBBBBBBBsBBBBBBBBbbe........'),
    (32, '.........MMAAAAAAnnnBBBBBBBBBBBBBBBBBbee........'),
    (33, '.........MAAAAAAAn.sbbbBBBBbBbBBBbbbbbe.........'),
    (34, '.........MAAAAAAAn.eeeebBBbbeebBbbeeeben........'),
    (35, '.........MAMAAAAnn.e.MAsbbbee.sbbeeaaeen........'),
    (36, '.........MMMMMAAn...MMAAsbee...seeaaaaann.......'),
    (37, '........MMAAAAnAn....MAAAeen....eaaaaaan........'),
    (38, '........MAAAAAnnn...MMAAAAn......aaaaaann.......'),
    (39, '........Maaaaann.....MAAAAn.......aaaaan........'),
    (40, '........MAAAAnn.....MMAAAAn.......aaaaann.......'),
    (41, '.........nnnnn.......MAAAAn.......aaaaan........'),
    (42, '........S.SnS....MMMMMMMMMMMn.aaaaaaaaaan.......'),
    (43, '.................MAAAAAAAAAAn.aaaaaaaaaan.......'),
    (44, '................MMAAAAAAAAAAnnaaaaaaaaaan.......'),
    (45, '................MAAAAAAAAAAAnnaaaaaaaaaan.......'),
    (46, '................SnSnSnnnnnnnnnnLnLnnnnnnn.......'),
]
TROLL_ATTACK = [
    (4, '.........................MMMMMMMMMuu............'),
    (5, '........................MMAGGGGGAuxxx...........'),
    (6, '......................MMGGGGggggGGGSMM..........'),
    (7, '............b...b..b.MMGGgggggggggddAAM.........'),
    (8, '...........bBb.bBbbBbnMMdddggggddGGGAGGdu.......'),
    (9, '..........bBBBbBBBBBbnMMMMMdddddGGgddGguxx......'),
    (10, '.........bBBBBBBBBBbbbnMMMMMMMMMMddnnnnnS.......'),
    (11, '........bBBMMMBBBbbbbenMMMMMMMMMAAnaaaann.......'),
    (12, '........MMMAAAMBbbbbeenAAAMAAAAAAnaaaaannn......'),
    (13, '.......MMAAAAAAMbbbeeennAAAAAAAAnaaaaaannn......'),
    (14, '......MMMMMMMAAAAbbeeenMnAAAAAAnaaaaaaannn......'),
    (15, '......MnnnnnnnAAAAMAeenAMnAAAAnaaaaaaannnn......'),
    (16, '......MAnnHKnAAAAMMAaenAAnnAAnaaaaaaannnan......'),
    (17, '.....MMAAAnnAAAAAAMAAanAAnnAAnaaaaaaannaan......'),
    (18, '....MMAAAAAAAAAAAAaAaanAAnnnnaaaaaaannnaan......'),
    (19, '...MMAAAAAAAAAAAAAAaaanAAnnnaaaaaaannnaaan......'),
    (20, '..MMAAAAnAAAAAAAAAAaannAnnnaaaaaaannnaaaan......'),
    (21, '..MAAAAnnaAAAAAAAAAaannnnnaaaaaaannnaaaann......'),
    (22, '..nAAAnnKKKKKKKKAAaannnnnaaaaaaannnaaaaan.......'),
    (23, '...nnnKKSrrrrrrSKAaannnnaaaaaaannnaaaaaan.......'),
    (24, '......KKrrRRRrrrKAaannnnaaaaannnnaaaaaann.......'),
    (25, '......MKSrrrrrSKAaannnMMnaaannnnaaaaaaan........'),
    (26, '......MAKKKKKKKAAaannAAAnnnnnnaaaaaaaaan........'),
    (27, '.......naaaaaaaaannnnAAAnnnnnaaaaaaaaann........'),
    (28, '.................nnnAAAnnnnaaaaaaaaaaan.........'),
    (29, '................eennnnnnnaaaaaaaaaaaaan.........'),
    (30, '...............eebBnnnnneeeeSLeeeeeeeeeee.......'),
    (31, '..............eebBBxBnBBBBBBsBBBBBBBBbbe........'),
    (32, '.............eebBBxsBBBBBBBBBBBBBBBBBbee........'),
    (33, '............eebBBx.sbbbBBBBbBbBBBbbbbbe.........'),
    (34, '..........ebebBBx..eeeebBBbbeebBbbeeeben........'),
    (35, '.........ebbBBBx...e.MAsbbbee.sbbeeaaeen........'),
    (36, '........ebbbBBx.....MMAAsbee...seeaaaaann.......'),
    (37, '.......ebbBBBBx......MAAAeen....eaaaaaan........'),
    (38, '.Ss..ebbbBBBBx......MMAAAAn......aaaaaann.......'),
    (39, '.....bBBBBBBx........MAAAAn.......aaaaan........'),
    (40, '....ebBBBBBx........MMAAAAn.......aaaaann.......'),
    (41, '....bbbBBBx..........MAAAAn.......aaaaan........'),
    (42, '.....BeeBBxx.....MMMMMMMMMMMn.aaaaaaaaaan.......'),
    (43, '......BBxxxG.....MAAAAAAAAAAn.aaaaaaaaaan.......'),
    (44, '.......x..gSs...MMAAAAAAAAAAnnaaaaaaaaaan.......'),
    (45, '......g......Ss.MAAAAAAAAAAAnnaaaaaaaaaan.......'),
    (46, '....ggG.........SnSnSnnnnnnnnnnLnLnnnnnnn.......'),
]


def troll():
    emit_boss('troll', 'TROLL_SPRITE', {'A': 'slate', 'B': 'brown', 'G': 'green', 'H': 'hotRed', 'K': 'black', 'L': 'lightGray', 'M': 'gray', 'R': 'red', 'S': 'sand', 'Y': 'yellow', 'a': 'darkSlate', 'b': 'darkBrown', 'd': 'darkGreen', 'e': 'deepBrown', 'g': 'midGreen', 'n': 'night', 'r': 'darkRed', 's': 'tan', 'u': 'rust', 'x': 'orangeBrown'}, TROLL, TROLL_ATTACK)


# ------------------------------------------------------------------ Act 2, Group 1
def padded(rows):
    return [(y, r.ljust(32, '.')) for y, r in rows]

FROST_WOLF = [
    (9,  '........W..W'),
    (10, '.......WL.WLM'),
    (11, '.......WLWLLM'),
    (12, '......WLLLLLLM'),
    (13, '.....WLLLLLLLM'),
    (14, '..WWLLCKLLLLLLM.....C.....C'),
    (15, '.KLLLLLLLLLLLLM....CBC...CBC'),
    (16, '..MMMMMLLLLLLLLWWWWCBCWWWCBCWW'),
    (17, '.....MMWWLLLLLLLLLLLLLLLLLLLLWW'),
    (18, '......MWWWWLLLLLLLLLLLLLLLLLMWL'),
    (19, '......MWWWWLLLLLLLLLLLLLLLLLMWL'),
    (20, '......MWWWWLLLLLLLLLLLLLLLLM.WL'),
    (21, '......WWWWLLLLLLLLLLLLLLLLLM.LM'),
    (22, '.......WWMMLLLLLLLLLLLLLLLML.LM'),
    (23, '.......MMMMMMLLLLLLLLLLMMMML.MM'),
    (24, '........MM.MMMMMMMMMMMMMMLM'),
    (25, '........LM...LM......LM..LM'),
    (26, '........LM...LM......LM..LM'),
    (27, '........LM...LM......LM..LM'),
    (28, '.......CLM..CLM.....CLM.CLM'),
    (29, '.......BBB..BBB.....BBB.BBB'),
]
FROST_WOLF_ATTACK = [
    (9,  '.........W..W'),
    (10, '........WL.WLM'),
    (11, '........WLWLLM'),
    (12, '.......WLLLLLLM'),
    (13, '..WWWWLLLLLLLLM'),
    (14, '.KLLLLLLCKLLLLM.....C.....C'),
    (15, '..WrWrrLLLLLLLM....CBC...CBC'),
    (16, '...rRRRRLLLLLLLWWWWCBCWWWCBCWW'),
    (17, '..WrWrMMWWLLLLLLLLLLLLLLLLLLLWW'),
    (18, '..MMMMMWWWWLLLLLLLLLLLLLLLLLMWL'),
    (19, '......MWWWWLLLLLLLLLLLLLLLLLMWL'),
    (20, '......MWWWWLLLLLLLLLLLLLLLLM.WL'),
    (21, '......WWWWLLLLLLLLLLLLLLLLLM.LM'),
    (22, '.......WWMMLLLLLLLLLLLLLLLML.LM'),
    (23, '......LMMMMMLLLLLLLLLLLMMMML.MM'),
    (24, '.....LM..MMMMMMMMMMMMMMM..LM'),
    (25, '....LM.......LM.....LM....LM'),
    (26, '...LM.......LM.......LM....LM'),
    (27, '..LM.......LM.........LM....LM'),
    (28, '.CLM......CLM.........CLM..CLM'),
    (29, '.BBB......BBB.........BBB..BBB'),
]


def frostWolf():
    emit(f'{OUT}/frostWolf.ts', 'FROST_WOLF_SPRITE', {'W': 'white', 'L': 'lightGray', 'M': 'gray', 'A': 'slate', 'N': 'darkSlate', 'C': 'cyan', 'B': 'blue', 'K': 'black', 'R': 'red', 'r': 'darkRed'}, frames(padded(FROST_WOLF), padded(FROST_WOLF_ATTACK)))

HARPY = [
    (2,  '..TT........................TT..'),
    (3,  '..TTT......................TTT..'),
    (4,  '..TTBb....................bBTT..'),
    (5,  '.TTTBBb......uuuu........bBBTTT.'),
    (6,  '.bTTTBBb...uuuuuuu......bBBTTTb.'),
    (7,  '...bTTBb..uuuuuuuur.....bBTTb...'),
    (8,  '..TTTBBBb.uuSSSuuurr...bBBBTTT..'),
    (9,  '..bTTTBBb.SKSSKsuurr...bBBTTTb..'),
    (10, '....bTTBb.SSSSSsuurr...bBTTb....'),
    (11, '...TTTBBb..SRRSsuurr...bBBTTT...'),
    (12, '...bTTTBBb..SSsuurrr..bBBTTTb...'),
    (13, '.....bTTBBb..ssuurrr.bBBTTb.....'),
    (14, '.....TTTBBBBBTTTTBBbBBBBTTT.....'),
    (15, '.......bTBBBBTTTTTBbBBBTb.......'),
    (16, '............BTTBTTBb............'),
    (17, '............BBTTTBBb............'),
    (18, '.............BTBBTb.............'),
    (19, '.............bBBBBb.............'),
    (20, '.............bBBBbb.............'),
    (21, '.............ebBBbe.............'),
    (22, '.............bBb.bB.............'),
    (23, '..............Y..Y..............'),
    (24, '..............Y..Y..............'),
    (25, '..............Y..Y..............'),
    (26, '..............Y..Y..............'),
    (27, '..........YYYYY.YYYYY...........'),
    (28, '.........W.W.W...W.W.W..........'),
]
HARPY_ATTACK = [
    (4,  '..........................bBT...'),
    (5,  '........................bBTTTT..'),
    (6,  '......................bBBBBTTTT.'),
    (7,  '.....................bBBBBBTTTT.'),
    (8,  '....................bBBBbbbb....'),
    (9,  '........uuuuu......bBBBBBTTTT...'),
    (10, '.......uuuuuuur...bBBBBBBBTTTT..'),
    (11, '......uuSSSuuurr..bBBBBbbbb.....'),
    (12, '.....SKSSKsuurr..bBBBBBBTTTT....'),
    (13, '.....SSSSSsuurr..bBBBBBBBTTTT...'),
    (14, '......SRRSsuurr.bBBBBBbbbb......'),
    (15, '.......SSsuurr..bBBBBBBTTTT.....'),
    (16, '........ssuurr..bBBBBBBTTTT.....'),
    (17, '........BTTTTTBBBBBBBBBbb.......'),
    (18, '........BTTTTBBBBBBBbbTTT.......'),
    (19, '.........BTTBBBBbbbbTTTT........'),
    (20, '..........bBBBBBBbbbbb..........'),
    (21, '...........bBbbbbbe.............'),
    (22, '..........YG..YG................'),
    (23, '.........YG..YG.................'),
    (24, '........YG..YG..................'),
    (25, '.......YG..YG...................'),
    (26, '...YYYYYG..YYYYG................'),
    (27, '..W.W.W...W.W.W.................'),
]


def harpy():
    emit(f'{OUT}/harpy.ts', 'HARPY_SPRITE', {'u': 'rust', 'r': 'darkRed', 'S': 'skin', 's': 'skinShade', 'K': 'black', 'R': 'red', 'T': 'tan', 'B': 'brown', 'b': 'darkBrown', 'e': 'deepBrown', 'Y': 'yellow', 'G': 'gold', 'W': 'white'}, frames(padded(HARPY), padded(HARPY_ATTACK)))

BANDIT = [
    (4,  '............DDDD'),
    (5,  '..........DDDDDDd'),
    (6,  '.........DDDDDDDdd'),
    (7,  '........DDDDDDDDddd'),
    (8,  '........DDnnnnDDddd'),
    (9,  '........DSKSSKsDddd'),
    (10, '........DSSSSSsDdddd'),
    (11, '........RRRRRRrrDddd'),
    (12, '........RRRRRrrrdddd'),
    (13, '.........rRRrrrDDdddd'),
    (14, '.......DDBBBBBBBbDDddd'),
    (15, '......DDBBBBBBBBbbDddd'),
    (16, '......DDDBBBBBBBbbDdddd'),
    (17, '..LLLGSSDBbBBBBbbbDdddd'),
    (18, '.gMMMGssDBbBBBBbbbbDddd'),
    (19, '.gm.....DeeeGeeeeebDddd'),
    (20, '........DBBBBBBbbbbDdddd'),
    (21, '........DBBBBbBBbbbDdddd'),
    (22, '.........bBBBbBBbbDddddd'),
    (23, '.........bBBb.bBbbDdddd'),
    (24, '.........bBBb..bBbb'),
    (25, '.........bBBb..bBbb'),
    (26, '.........bBBb..bBbb'),
    (27, '.........eeeb..eeeb'),
    (28, '........eeeeb.eeeeb'),
]
BANDIT_ATTACK = [
    (4,  '...........DDDD'),
    (5,  '.........DDDDDDd'),
    (6,  '........DDDDDDDdd'),
    (7,  '.......DDDDDDDDddd'),
    (8,  '.......DDnnnnDDddd'),
    (9,  '.......DSKSSKsDddd'),
    (10, '.......DSSSSSsDdddd'),
    (11, '.......RRRRRRrrDddd'),
    (12, '.......RRRRRrrrdddd'),
    (13, '........rRRrrrDDdddd'),
    (14, '..LLLGSSSDBBBBBBbDDddd'),
    (15, '.gMMMGssDBBBBBBBBbbDddd'),
    (16, '.gm.....DDBBBBBBBbbDdddd'),
    (17, '.........DBbBBBBbbbDdddd'),
    (18, '.........DBbBBBBbbbbDddd'),
    (19, '.........DeeeGeeeeebDddd'),
    (20, '.........DBBBBBBbbbbDdddd'),
    (21, '.........DBBBBbBBbbbDdddd'),
    (22, '.........bBBBbBBbbDddddd'),
    (23, '........bBBb..bBbbDdddd'),
    (24, '.......bBBb....bBbb'),
    (25, '......bBBb......bBbb'),
    (26, '......bBBb......bBbb'),
    (27, '.....eeeb.......eeeb'),
    (28, '....eeeeb.......eeeeb'),
]


def bandit():
    emit(f'{OUT}/bandit.ts', 'BANDIT_SPRITE', {'D': 'darkGreen', 'd': 'deepTeal', 'S': 'skin', 's': 'skinShade', 'K': 'black', 'R': 'red', 'r': 'darkRed', 'B': 'brown', 'b': 'darkBrown', 'e': 'deepBrown', 'G': 'gold', 'L': 'lightGray', 'M': 'gray', 'g': 'green', 'm': 'midGreen', 'n': 'night'}, frames(padded(BANDIT), padded(BANDIT_ATTACK)))


# ------------------------------------------------------------------ Act 2, Group 2
GOLEM = [
    (3,  '...........MMMMM................'),
    (4,  '..........MLLLLMA...............'),
    (5,  '.........MLLLLLMAA..............'),
    (6,  '.........LYYLYYMAA..............'),
    (7,  '.........MLLLLLMAA..............'),
    (8,  '.......MMMMMMMMMAAAA............'),
    (9,  '.....MMLLLLLLLLMMMAAAA..........'),
    (10, '....MLLLLLLLLLOLMMMAAAAA........'),
    (11, '...MLLLLMLLLLOLLLMMAAAAAA.......'),
    (12, '...MLLLMMLLLOOLLLMMAAAAAA.......'),
    (13, '...MLLMMMLLLOLLLLMMAAAAAAA......'),
    (14, '..MLLLMA.MLOLLLLMMAAA.AAAA......'),
    (15, '..MLLMAA.MMLLLLMMMAAA.AAAA......'),
    (16, '..MLLMAA.MMMLLMMMAAAA.AAAA......'),
    (17, '.MLLLLMA.MgMMMMMAAAAA.AAAAA.....'),
    (18, 'MLLLLLMAA.MMMMMAAAAA..AAAAA.....'),
    (19, 'MLLLLMMAA.gMMMAAAAgA..AAAAA.....'),
    (20, 'MMLLMMMAA..MMMAAAAA...AAAA......'),
    (21, '.MMMMMAA...MMAAAAAA...NAAN......'),
    (22, '..NNNNN....MMAAAAAA.............'),
    (23, '..........MLLMA.MMAA............'),
    (24, '..........MLLMA.MMAA............'),
    (25, '..........MLLMA.MMAA............'),
    (26, '.........MLLLMA.MMAAA...........'),
    (27, '.........MMMMAA.MMAAA...........'),
    (28, '.........NNNNNN.NNNNN...........'),
]
GOLEM_ATTACK = [
    (4,  '.........MMMMM..................'),
    (5,  '........MLLLLMA.................'),
    (6,  '.......MLLLLLMAA................'),
    (7,  '.......LYYLYYMAA................'),
    (8,  '.......MLLLLLMAA................'),
    (9,  '..MMMMMMMMMMMMMAAAA.............'),
    (10, '.MLLLLLLLLLLLLMMMAAAA...........'),
    (11, 'MLLLLLLLLLLLLOLLMMAAAAA.........'),
    (12, 'MLLLLLLMLLLLOLLLMMAAAAAA........'),
    (13, 'MMLLLLMMLLLOOLLLMMAAAAAA........'),
    (14, '.MMMMMMMMLLOLLLLLMMAAAAAA.......'),
    (15, '..NNNN..MLOLLLLMMAAA.AAAA.......'),
    (16, '........MMLLLLMMMAAA.AAAA.......'),
    (17, '........MMMLLMMMAAAA.AAAA.......'),
    (18, '........MgMMMMMAAAAA.AAAAA......'),
    (19, '.........MMMMMAAAAA..AAAAA......'),
    (20, '.........gMMMAAAAgA..AAAAA......'),
    (21, '..........MMMAAAAA...AAAA.......'),
    (22, '..........MMAAAAAA...NAAN.......'),
    (23, '.........MLLMA..MMAA............'),
    (24, '........MLLMA....MMAA...........'),
    (25, '.......MLLMA......MMAA..........'),
    (26, '......MLLLMA......MMAAA.........'),
    (27, '......MMMMAA......MMAAA.........'),
    (28, '......NNNNNN......NNNNN.........'),
]


def stoneGolem():
    emit(f'{OUT}/stoneGolem.ts', 'STONE_GOLEM_SPRITE', {'K': 'black', 'L': 'lightGray', 'M': 'gray', 'A': 'slate', 'N': 'darkSlate', 'Y': 'yellow', 'O': 'orange', 'g': 'midGreen'}, frames(padded(GOLEM), padded(GOLEM_ATTACK)))


GNOLL = [
    (3,  '...........b..b.................'),
    (4,  '..........bTbbTb................'),
    (5,  '.........bTTbTTTb...............'),
    (6,  '........TTTTTTTTbe..............'),
    (7,  '.....TTTTTKTTTTTbee.............'),
    (8,  '...TTTTTTTTTTTTTbeee............'),
    (9,  '..nTTTTTTTTTTTTbbeee............'),
    (10, '...WsWsWTTTTTTbbeeee............'),
    (11, '....ssssTTTTTbbbeeeee...........'),
    (12, '..LL.....TTBTTTbbeeeee..........'),
    (13, '.LMML...TTTTTTBTTbeeee..........'),
    (14, '.LMMu..TTBTTTTTTTTbee...........'),
    (15, '..L.u.TTTTTTBTTTTTbbe...........'),
    (16, '....uTTTb.TTTTBTTTbbb...........'),
    (17, '....uTTb..TTTTTTTTbbb...........'),
    (18, '....sTb...eeeOeeeeebb...........'),
    (19, '....u.....TTBTTTTBTb............'),
    (20, '....u.....bTTTTTTTb.............'),
    (21, '..........bTTb.bTTb.............'),
    (22, '..........bTTb..bTTb............'),
    (23, '.........bTTb....bTTb...........'),
    (24, '.........bTb......bTb...........'),
    (25, '.........bTb......bTb...........'),
    (26, '........bTb......bTb............'),
    (27, '.......eeeb.....eeeb............'),
    (28, '......eeeeb....eeeeb............'),
]
GNOLL_ATTACK = [
    (4,  '..........b..b..................'),
    (5,  '.........bTbbTb.................'),
    (6,  '........bTTbTTTb................'),
    (7,  '.......TTTTTTTTbe...............'),
    (8,  '....TTTTTKTTTTTbee..............'),
    (9,  '..TTTTTTTTTTTTTbeee.............'),
    (10, '.nTTTTTTTTTTTTbbeee.............'),
    (11, '..WRWRW.TTTTTbbeeee.............'),
    (12, '...RRR..TTTTTbbbeeeee...........'),
    (13, '..WRWRWTTBTTTTbbeeeee...........'),
    (14, '.......TTTTTTBTTbeeee...........'),
    (15, 'LL...TTTBTTTTTTTTbee............'),
    (16, 'LMuuuTTTTTTBTTTTTbbe............'),
    (17, 'LMLs.uuTb.TTTTBTTTbbb...........'),
    (18, '.L.......TTTTTTTTbbb............'),
    (19, '.........eeeOeeeeebb............'),
    (20, '.........TTBTTTTBTb.............'),
    (21, '.........bTTTTTTTb..............'),
    (22, '........bTTb..bTTb..............'),
    (23, '.......bTTb....bTTb.............'),
    (24, '......bTb.......bTTb............'),
    (25, '.....bTb.........bTb............'),
    (26, '....bTb..........bTb............'),
    (27, '...eeeb.........eeeb............'),
    (28, '..eeeeb........eeeeb............'),
]


def gnoll():
    emit(f'{OUT}/gnoll.ts', 'GNOLL_SPRITE', {'n': 'night', 'T': 'tan', 'B': 'brown', 'b': 'darkBrown', 'e': 'deepBrown', 'K': 'black', 'W': 'white', 'R': 'red', 's': 'skinShade',  'L': 'lightGray', 'M': 'gray', 'u': 'rust', 'O': 'gold'}, frames(padded(GNOLL), padded(GNOLL_ATTACK)))


WISP = [
    (4,  '..............R.................'),
    (5,  '.............RO.................'),
    (6,  '.............ROR................'),
    (7,  '............ROOR..R.............'),
    (8,  '............ROGOR.RO............'),
    (9,  '...........ROGGOORO.............'),
    (10, '...........ROGYGOOR.............'),
    (11, '..........ROGYYYGOR.............'),
    (12, '..........ROGYWYYGOR............'),
    (13, '..........RGnWWWnGOR............'),
    (14, '..........RGnWWWnGOR............'),
    (15, '..........ROGYWYYGOR............'),
    (16, '...........ROGYYGOR.............'),
    (17, '...........ROOGGOOR.............'),
    (18, '............ROOOOR..............'),
    (19, '.............ROOR...............'),
    (20, '.............ROR................'),
    (21, '..............RO................'),
    (22, '...............R................'),
    (23, '..............R.................'),
]
WISP_ATTACK = [
    (4,  '...............R................'),
    (5,  '..............RO................'),
    (6,  '..............ROR...............'),
    (7,  '.............ROOR..R............'),
    (8,  '.............ROGOR.RO...........'),
    (9,  '............ROGGOORO............'),
    (10, '............ROGYGOOR............'),
    (11, '...........ROGYYYGOR............'),
    (12, '....RROO..ROGYWYYGOR............'),
    (13, '.RROOGYYGRGnWWWnGOR.............'),
    (14, 'ROGYWWWYYGYnWWYnOR..............'),
    (15, '.RROOGYYGRGYWYYGOR..............'),
    (16, '....RROO..ROGYYGOR..............'),
    (17, '...........ROOGGOOR.............'),
    (18, '............ROOOOR..............'),
    (19, '.............ROOR...............'),
    (20, '..............ROR...............'),
    (21, '...............RO...............'),
    (22, '................R...............'),
    (23, '...............R................'),
]


def wisp():
    emit(f'{OUT}/wisp.ts', 'WISP_SPRITE', {'K': 'black', 'R': 'red', 'O': 'orange', 'G': 'gold', 'Y': 'yellow', 'W': 'white', 'n': 'night'}, frames(padded(WISP), padded(WISP_ATTACK)))


# ------------------------------------------------------------------ Act 2, Group 3
MINO = [
    (1,  '...W.....................W......'),
    (2,  '...SW...................WS......'),
    (3,  '...SS...................SS......'),
    (4,  '....SSS...............SSS.......'),
    (5,  '.....SSSSbbebbbbebbbSSSS........'),
    (6,  '.........eBBBBBBBBBBee..........'),
    (7,  '.........beebBBBBbeebe..........'),
    (8,  '.........bHReBBBBeRHbbe.........'),
    (9,  '.........bBBBBBBBBBBbBBee.......'),
    (10, '........bBBBBBBBBbbBBBBBBe......'),
    (11, '.......TTTTTTTBBbBBBBBBBBbbe....'),
    (12, '..LMo.sTeTTTeTsbBBBBBBBBBBBbe...'),
    (13, '.WLMo.ssGsGsssbBBBBBBBBBBBBbbe..'),
    (14, '.WLMo....G..bBTTTBBTTTBBBBBBbbe.'),
    (15, '.WLMo...bBBTTTTBTTTTBBBBBBBbbe..'),
    (16, '..LMo..bBBBBTTTBBTTTBBBBBBbBbe..'),
    (17, '....o.bBBbBBBBBBBBBBBBBBBbbBbe..'),
    (18, '....oBBBbbBTBTBTBBBBBBBbbbBBe...'),
    (19, '...BBBBb.bBTBTBTBBBBBBbbb.bBBe..'),
    (20, '...BBBb..bBBBBBBBBBBBbbb..bBBe..'),
    (21, '....o....rrrrrrrrrrrrrr...bss...'),
    (22, '....o....rRRRRRRRRRRRRr....ss...'),
    (23, '....o.....bBBBrRrBBBbb..........'),
    (24, '....o.....bBBBb.bBBBBb..........'),
    (25, '....o.....bBBBb..bBBBb..........'),
    (26, '....o....bBBBBb..bBBBBb.........'),
    (27, '....o....bBBBBb..bBBBBb.........'),
    (28, '........eeeeee...eeeeee.........'),
    (29, '........eeeeee...eeeeee.........'),
]
MINO_ATTACK = [
    (2,  '..W.....................W.......'),
    (3,  '..SW...................WS.......'),
    (4,  '..SS...................SS.......'),
    (5,  '...SSS...............SSS........'),
    (6,  '....SSSSbbebbbbebbbSSSS.........'),
    (7,  '........eBBBBBBBBBBee...........'),
    (8,  '........beebBBBBbeebe...........'),
    (9,  '........bHHeBBBBeHHbbe..........'),
    (10, '........bBBBBBBBBBBbBBee........'),
    (11, '.......bBBBBBBBBbbBBBBBBe.......'),
    (12, '......TTTTTTTBBbBBBBBBBBbbe.....'),
    (13, '.....sTeTTTeTsbBBBBBBBBBBBbe....'),
    (14, '.....ssGsGsssbBBBBBBBBBBBBbbe...'),
    (15, '..L.....G..bBTTTBBTTTBBBBBBbbe..'),
    (16, '.WLM....bBBBTTTTBTTTTBBBBBbbe...'),
    (17, '.WLMooBBBBBBBBTTTBBTTTBBBBbBbe..'),
    (18, '.WLMooBBBBBBBBBBBBBBBBBBBbbBBe..'),
    (19, '..LM.....bBTBTBTBBBBBBbbb.bBBe..'),
    (20, '..L......bBBBBBBBBBBbbb...bBBe..'),
    (21, '.........rrrrrrrrrrrrrr...bss...'),
    (22, '.........rRRRRRRRRRRRRr....ss...'),
    (23, '........bBBBBrRrBBBBb...........'),
    (24, '.......bBBBb.....bBBBb..........'),
    (25, '......bBBBb.......bBBBb.........'),
    (26, '.....bBBBb........bBBBb.........'),
    (27, '.....bBBBb.........bBBBb........'),
    (28, '....eeeeee.........eeeeee.......'),
    (29, '....eeeeee.........eeeeee.......'),
]


def minotaur():
    emit(f'{OUT}/minotaur.ts', 'MINOTAUR_SPRITE', {'K': 'black', 'W': 'white', 'S': 'sand', 'B': 'brown', 'b': 'darkBrown', 'e': 'deepBrown', 'T': 'tan', 'H': 'hotRed', 'R': 'red', 'r': 'darkRed', 's': 'skinShade', 'n': 'night', 'G': 'gold', 'L': 'lightGray', 'M': 'gray', 'o': 'orangeBrown'}, frames(padded(MINO), padded(MINO_ATTACK)))


MEDUSA = [
    (2,  '..........g..g..g...............'),
    (3,  '.........gG.gG.gG.g.............'),
    (4,  '........gGg.GgGgGgG.............'),
    (5,  '.......gGgGGGGGGGgGg............'),
    (6,  '......gG.GGGGGGGGGgG............'),
    (7,  '.........gSSSSSSGgg.g...........'),
    (8,  '.........SYKSSYKsGgGg...........'),
    (9,  '.........SSSSSSSsGg.............'),
    (10, '..........SRRSSssg..............'),
    (11, '...........SSSssg...............'),
    (12, '.........uuSSSSsuu..............'),
    (13, '.......SSuuuGGGGuuu.............'),
    (14, '......SSs.GGGGGGGgg.............'),
    (15, '.....SS...GGGGGGGgg.............'),
    (16, '..........GGgGGgGgg.............'),
    (17, '...........gGGGGGgg.............'),
    (18, '...........gGGYGGgg.............'),
    (19, '............gGGYGGgg............'),
    (20, '.............gGGYGGgg...........'),
    (21, '..............gGGYGGg...........'),
    (22, '.........gg...gGGYGGg...........'),
    (23, '........gGGgggGGYGGgg...........'),
    (24, '.......gGGGGGGGYGGGg............'),
    (25, '.......gGYYYYYYYGGg.............'),
    (26, '........ggGGGGGGgg..............'),
]
MEDUSA_ATTACK = [
    (2,  '.........g..g..g................'),
    (3,  '........gG.gG.gG.g..............'),
    (4,  '...g...gGg.GgGgGgG..............'),
    (5,  '..gGg.gGgGGGGGGGgGg.............'),
    (6,  '...gG.G.GGGGGGGGGgG.............'),
    (7,  '........gSSSSSSGgg.g............'),
    (8,  '........SHHSSHHsGgGg............'),
    (9,  '........SSSSSSSsGg..............'),
    (10, '.........SRRSSssg...............'),
    (11, '..........SSSssg................'),
    (12, '.SSs....uuSSSSsuu...............'),
    (13, '..SSSSSuuuGGGGuuu...............'),
    (14, '.........GGGGGGGgg..............'),
    (15, '.........GGGGGGGgg..............'),
    (16, '.........GGgGGgGgg..............'),
    (17, '..........gGGGGGgg..............'),
    (18, '..........gGGYGGgg..............'),
    (19, '...........gGGYGGgg.............'),
    (20, '............gGGYGGgg............'),
    (21, '.............gGGYGGg............'),
    (22, '........gg...gGGYGGg............'),
    (23, '.......gGGgggGGYGGgg............'),
    (24, '......gGGGGGGGYGGGg.............'),
    (25, '......gGYYYYYYYGGg..............'),
    (26, '.......ggGGGGGGgg...............'),
]


def medusa():
    emit(f'{OUT}/medusa.ts', 'MEDUSA_SPRITE', {'K': 'black', 'g': 'darkGreen', 'G': 'midGreen', 'S': 'green', 's': 'midGreen', 'Y': 'yellow', 'R': 'red', 'u': 'gold', 'H': 'yellow'}, frames(padded(MEDUSA), padded(MEDUSA_ATTACK)))


WYVERN = [
    (1,  '................W.......CCCCCC..'),
    (2,  '...........LL...DDCCCCCCddddd...'),
    (3,  '....dDDDDLL.....DDCCCddddd......'),
    (4,  '..dDDDDDDDDd....DDCddCCCdd......'),
    (5,  '.dDDDYKDDDDd....DDdCddddCCCdd...'),
    (6,  '.CnDDDDDDDDDd..DDdddCddddddCCd..'),
    (7,  '.nWnWnWnDDDDd..DDddddCdddddddC..'),
    (8,  '..LLLLLLdDDDd..DDdddddCddd......'),
    (9,  '....dddddDDDd..DDddddddCd.......'),
    (10, '.......dLDDDDdDDdddddddCd....P..'),
    (11, '.......dLDDDDdDDddddddddCd..PPP.'),
    (12, '.......dLLDDDdDDdddddddddC..pDp.'),
    (13, '.......dLLDDDDdDdddddd......dD..'),
    (14, '.......dLLLDDDDDDDdddDDDd...dD..'),
    (15, '......dDLLLLDDDDDDDDDDDDDd.dDd..'),
    (16, '......dDLLLLLDDDDDDDDDDDDDdDd...'),
    (17, '.......dLLLLLDDDDDDDDDDDDDDDDd..'),
    (18, '........dLLLLDDDDDdDDDDDdddd....'),
    (19, '..................dDDDDDDdd.....'),
    (20, '....................ddDDDDDDd...'),
    (21, '......................dddDDDDd..'),
    (22, '.........................WdWdW..'),
    (23, '................................'),
    (24, '................................'),
    (25, '................................'),
    (26, '................................'),
]
WYVERN_ATTACK = [
    (1,  '................W.......CCCCCC..'),
    (2,  '................DDCCCCCCddddd...'),
    (3,  '............LL..DDCCCddddd......'),
    (4,  '.....dDDDDLL....DDCddCCCdd......'),
    (5,  '...dDDDDDDDDd...DDdCddddCCCdd...'),
    (6,  '.dDDDDYKDDDDd..DDdddCddddddCCd..'),
    (7,  '.CnDDDDDDDDDd..DDddddCdddddddC..'),
    (8,  '..WnWnWdDDDDd..DDdddddCddd......'),
    (9,  '.....RRRRdDDd..DDddddddCd.......'),
    (10, '...rRRRRRdDDDdDDdddddddCd....P..'),
    (11, '.WnWnWLLLdDDDdDDddddddddCd..PPP.'),
    (12, '..LLLLLLdLDDDdDDdddddddddC..pDp.'),
    (13, '.......dLLDDDDdDdddddd......dD..'),
    (14, '.......dLLLDDDDDDDdddDDDd...dD..'),
    (15, '......dDLLLLDDDDDDDDDDDDDd.dDd..'),
    (16, '......dDLLLLLDDDDDDDDDDDDDdDd...'),
    (17, '.......dLLLLLDDDDDDDDDDDDDDDDd..'),
    (18, '........dLLLLDDDDDdDDDDDdddd....'),
    (19, '..................dDDDDDDdd.....'),
    (20, '....................ddDDDDDDd...'),
    (21, '......................dddDDDDd..'),
    (22, '.........................WdWdW..'),
    (23, '................................'),
    (24, '................................'),
    (25, '................................'),
    (26, '................................'),
]


def wyvern():
    emit(f'{OUT}/wyvern.ts', 'WYVERN_SPRITE', {'K': 'black', 'D': 'midGreen', 'd': 'darkGreen', 'C': 'green', 'n': 'deepTeal', 'L': 'sand', 'Y': 'yellow', 'W': 'white', 'R': 'red', 'r': 'darkRed', 'P': 'magenta', 'p': 'plum'}, frames(padded(WYVERN), padded(WYVERN_ATTACK)))


# ------------------------------------------------------------------ Act 2 Epic Monsters (drawn by the art reviewer)
FROST_GIANT = [
    (1, '........WWWWL...................'),
    (2, '.......LLLWWWWLM.......W........'),
    (3, '......LLMMMWWWLLM.....WCB.......'),
    (4, '.....LMMMMMMWWLLM.....WCB.......'),
    (5, '.....DEDDEDMMWLLA....WCCBB.W....'),
    (6, '...W.MMMLMMAMWLMA....WCCBB.WB...'),
    (7, '..WCBLMMMMMAWWLMA...WCCCBBWCBN..'),
    (8, '..WCBWWWWWWWWWLA....WCCCBBWCBN..'),
    (9, '.WCCBBWBAAWWWWLAMMMWCCCBBNCCBN..'),
    (10, '.WCCBWCBNWWWWWLALMNNCCBBNNBBNN..'),
    (11, '.NCBBNBNNWWWWLALLLANNNNNNNNNNAD.'),
    (12, '..NNNNNNWLWWLALLMMMMMMMAADMMAAD.'),
    (13, '..LMMAAAWLWLAAAAAAMMAMMAADMMAAD.'),
    (14, '..LMMAA.CMCMMMMMMAMMMMAAADMMAAD.'),
    (15, '..WCCBN.MMMMMMMMMAMMMAAAADCBBNN.'),
    (16, '..CCBBN..MMMMMMMMAMMAAAA..CBBNN.'),
    (17, '..WCBNN..AMMMMMMMAMAAAAD..BBNNN.'),
    (18, '.LLMMAA..dddddddddddddddd.MMAAD.'),
    (19, '.LMMMAA.bbbbbbbbbbbbbbbbbLMMMAD.'),
    (20, '.MMMAAD.bebbbbbebbbbbbebbLMMMAD.'),
    (21, '...bd...bbbbbbbbbbbbbbbbdMMAADD.'),
    (22, '...bd...b.bbebbbb.bbbebd..DDDD..'),
    (23, '..WWCB...MMMAA..MMMAAD..........'),
    (24, '.WCCCBW..LMMAA..MMMAAD..........'),
    (25, '.CWCCBBN.LMMAA..MMAAAD..........'),
    (26, '.WCCCBBN.LMMAA..MMAAAD..........'),
    (27, '.CCCBBNN.WWLLM.WWWLLMA..........'),
    (28, '.WCBBNNN.WLLMMAWLLLMMA..........'),
    (29, '..NBNN...AAAAA.AAAAAAA..........'),
]
FROST_GIANT_ATTACK = [
    (1, '..W..W..........................'),
    (2, '..WCWCB....WWWWL.......W........'),
    (3, '.WCCCCBW..LLLWWWWLM...WCB.......'),
    (4, '.WCCCBBN.DDMMMWWWLLM..WCB.......'),
    (5, '.CCCBBNNDMMMMDMWWLLM.WCCBB.W....'),
    (6, '.NCBBNNNDEDDEDMMWLLA.WCCBB.WB...'),
    (7, '..NNNNN.MMMLMMAMWLMAWCCCBBWCBN..'),
    (8, '...bd...LMMMMMAWWLMAWCCCBBWCBN..'),
    (9, '..LLLMALWWWWWWWWWLAWCCCBBNCCBN..'),
    (10, '.LLMMMAAWxWxWxWWWLANCCBBNNBBNN..'),
    (11, '.LMMMAADWxhhhxWWWLANNNNNNNNNNAD.'),
    (12, '.WCCBNN.LxhhhxWWLAMMMMMAADMMAAD.'),
    (13, '.CCCBBN.LMxxxWWLAAMMAMMAADMMAAD.'),
    (14, '.WCCBNNLAMMWLWLAMAMMMMAAADMMAAD.'),
    (15, '..LMMMMMAMMCMCMMMAMMMAAAADCBBNN.'),
    (16, '..MMMMMAAMMMMMMMMAMMAAAA..CBBNN.'),
    (17, '...AAAAA.AMMMMMMMAMAAAAD..BBNNN.'),
    (18, '.........dddddddddddddddd.MMAAD.'),
    (19, '........bbbbbbbbbbbbbbbbbLMMMAD.'),
    (20, '........bebbbbbebbbbbbebbLMMMAD.'),
    (21, '........bbbbbbbbbbbbbbbbdMMAADD.'),
    (22, '........b.bbebbbb.bbbebd..DDDD..'),
    (23, '.........MMMAA..MMMAAD..........'),
    (24, '.........LMMAA..MMMAAD..........'),
    (25, '.........LMMAA..MMAAAD..........'),
    (26, '.........LMMAA..MMAAAD..........'),
    (27, '.........WWLLM.WWWLLMA..........'),
    (28, '.........WLLMMAWLLLMMA..........'),
    (29, '.........AAAAA.AAAAAAA..........'),
]


def frostGiant():
    emit(f'{OUT}/frostGiant.ts', 'FROST_GIANT_SPRITE', {'K': 'black', 'W': 'white', 'L': 'lightGray', 'M': 'gray', 'A': 'slate', 'D': 'darkSlate', 'C': 'cyan', 'B': 'blue', 'N': 'navy', 'E': 'cyan', 'h': 'darkRed', 'd': 'darkBrown', 'b': 'brown', 'e': 'deepBrown', 'x': 'deepBrown'}, frames(padded(FROST_GIANT), padded(FROST_GIANT_ATTACK)))


CHIMERA = [
    (1, '.................hhh............'),
    (2, '................hhHHh...........'),
    (3, '...............LhH..hH..........'),
    (4, '..............LLLMAA..H..gGGg...'),
    (5, '.............LYeLMMAA...gGGYGg..'),
    (6, '............LLLLLMMA...gGGGGGGg.'),
    (7, '.......uoRoRALLLMMA.....kkgGGGg.'),
    (8, '......uooooRoRWLMMA.........SGg.'),
    (9, '.....uoTTTTooRoWMMMA........SGg.'),
    (10, '....uoTTTTTTooR.LMMA........SGg.'),
    (11, '...RTTYeTTTTooRoLMMAA.......SGg.'),
    (12, '..TTTTTTTTTSoooRLMMAA.......SGg.'),
    (13, '.STTTTTTTTSoooRRLMMAASSSSSB.SGg.'),
    (14, '.eTSSSTTTSooooRoTTTTTTTTSSTBSGg.'),
    (15, '..SSSSSTTooooooRTTTTTTTSTTTTB...'),
    (16, '...ddSTToooooRoRTTTTTTSTTTTTB...'),
    (17, '....ooooooooRoRRTTTTTTTTTTTBB...'),
    (18, '.....RooooooRRRTTTTTTTTTTTBBB...'),
    (19, '......RoRooRoRTTTTTTTTBTTTBBd...'),
    (20, '..........BBTTTTTTTTTBBTTTBBd...'),
    (21, '......STTTBBBBBdBBBBBBSTTTTB.Bd.'),
    (22, '......TTTTB.BBBdBBBBBBTTTTBB.Bd.'),
    (23, '......TTTTB.BBBd.......TTTB..Bd.'),
    (24, '......TTTBB.BBdd.......TTTB..Bd.'),
    (25, '......TTTBB.BBdd.......TTTB..Bd.'),
    (26, '......TTTBB.BBdd.......TTTB..Bd.'),
    (27, '.....STTTBB.BBdd......STTTB.BBd.'),
    (28, '.....STTTBB.BBdd......STTTB.BBd.'),
]
CHIMERA_ATTACK = [
    (1, '...................hhh..........'),
    (2, '..................hhHHh.........'),
    (3, '.................LhH..hH........'),
    (4, '................LLLMAA..gGGg....'),
    (5, '...............LYeLMMAAgGYGGg...'),
    (6, '..............LLLLLMMA.wGGGGGg..'),
    (7, '...........uoRoReLMMA...xx.gGGg.'),
    (8, '..........uooooRoRMMA..wkkgGGGg.'),
    (9, '.........uoTTTTooRoMMA......SGg.'),
    (10, '........uoTTTTTTooRMMA......SGg.'),
    (11, '.......dTTYeTTTTooRoMAA.....SGg.'),
    (12, '..r...STTTTTTTTSoooRMAA.....SGg.'),
    (13, '.rOr.STTTTTTTTSoooRRMAASSSSSSGg.'),
    (14, '.OYOreSSSTTTTSooooRoTTTTTTSSSGg.'),
    (15, '.YYYOOwTwTTTSooooooRTTTTTSTTSGg.'),
    (16, '.YwwYYOYOxxTSoooooRoTTTTSTTTTTB.'),
    (17, '.wwwwYYOxxxTooooooRRTTTTTTTTTBB.'),
    (18, '.YwwYYwSwSSTooooRoRTTTTTTTTTBBB.'),
    (19, '.OYYOOrSSSSoooRooRTTTTTTBTTTBBd.'),
    (20, '.rOOr....RooooRoRTTTTTTBBTTTBBd.'),
    (21, '..r.....STTTBBBBdBBBBBBBTTTTBd..'),
    (22, '........STTB.BBBdBBBBBBBTTTTB...'),
    (23, '.......STTTB.BBd.........TTTB...'),
    (24, '.......STTB.BBBd.........TTTB...'),
    (25, '......STTTB.BBd...........TTTB..'),
    (26, '......STTB.BBdd...........TTTB..'),
    (27, '.....STTTB.Bdd...........STTTB..'),
    (28, '.....SSTTB.Bdd...........STTTB..'),
]


def chimera():
    emit(f'{OUT}/chimera.ts', 'CHIMERA_SPRITE', {'K': 'black', 'S': 'sand', 'T': 'tan', 'B': 'brown', 'd': 'darkBrown', 'e': 'deepBrown', 'u': 'gold', 'o': 'orangeBrown', 'R': 'rust', 'W': 'white', 'L': 'lightGray', 'M': 'gray', 'A': 'slate', 'H': 'darkBrown', 'h': 'sand', 'G': 'green', 'g': 'midGreen', 'k': 'darkGreen', 'Y': 'yellow', 'r': 'red', 'O': 'orange', 'w': 'white', 'x': 'darkRed'}, frames(padded(CHIMERA), padded(CHIMERA_ATTACK)))


HYDRA = [
    (1, '...............k.k..............'),
    (2, '.............kGGGkk.............'),
    (3, '...........gGGGrGgk.............'),
    (4, '..........GGGGGGggk.............'),
    (5, '..........wSSSSSgkk.............'),
    (6, '............SSSkk...............'),
    (7, '........k.k....SGgk.............'),
    (8, '......kGGGkk....SGgk............'),
    (9, '....gGGGrGgk.....SGgk...........'),
    (10, '...GGGGGGggk......SGgk..........'),
    (11, '...wSSSSSgkk......SGgk..........'),
    (12, '.....SSSkkSGgk.....SGgk...k.....'),
    (13, '...........SGgk....SGgk....gk...'),
    (14, '............SGgk...SGgk.....gk..'),
    (15, '......k.k....SGgk..SGgk.....Ggk.'),
    (16, '....kGGGkk...SGgk.SGgkt.t.tGGgk.'),
    (17, '..gGGGrGgk....SGgkGGGGgggkkkgkt.'),
    (18, '.GGGGGGggk.....GGGGgGGGgkggkkkt.'),
    (19, '.wSSSSSgkkgk..GGGgGGGgggkgggkt..'),
    (20, '...SSSkk.SGgkSGGGGGgGggkggkkkt..'),
    (21, '..........SGgkSGGgGGgggkggkkt...'),
    (22, '...........SGgkSGGgggkggkkktt...'),
    (23, '.............TSSSSgggkggkkktt...'),
    (24, '.............GTTSSSSSSgkkkkt....'),
    (25, '.............GgTTTSSSSSkkttk....'),
    (26, '............GGgkk......Gggkk....'),
    (27, '............Gggkk......ggkkt....'),
    (28, '...........wGwgwk.....wGwgwt....'),
]
HYDRA_ATTACK = [
    (2, '.........k.k....................'),
    (3, '.......kGGGkk...................'),
    (4, '.....gGGGrGgk.GGk...............'),
    (5, '....GGGGGGggkGGgGgk.............'),
    (6, '....w.w.xxxgkggggggk............'),
    (7, '........xxxkkSSSSSggk...........'),
    (8, '....w.w.SSgk......SGgk..........'),
    (9, '....SSSSSkk........SGgk.........'),
    (10, '...................SGgk.........'),
    (11, '......k.k..........SGgk.........'),
    (12, '....kGGGkk.........SGgk...k.....'),
    (13, '..gGGGrGgkGGk......SGgk....gk...'),
    (14, '.GGGGGGggkggGk.....SGgk.....gk..'),
    (15, '.w.w.xxxgkSggGk....SGgk.....Ggk.'),
    (16, '.....xxxkk.SSggk..SGgkt.t.tGGgk.'),
    (17, '.w.w.SSgk....SggkGGGGGgggkkkgkt.'),
    (18, '.SSSSSkk.......GGGGgGGGgkggkkkt.'),
    (19, '..............GGGgGGGgggkgggkt..'),
    (20, '......k.k....SGGGGGgGggkggkkkt..'),
    (21, '....kGGGkkGGGkSGGgGGgggkggkkt...'),
    (22, '..gGGGrGgkggggSSGGgggkggkkktt...'),
    (23, '.GGGGGGggkSSSSSSSSgggkggkkktt...'),
    (24, '.w.w.xxxgk...GTTSSSSSSgkkkkt....'),
    (25, '.....xxxkk...GgTTTSSSSSkkttk....'),
    (26, '.w.w.SSgk...GGgkk......Gggkk....'),
    (27, '.SSSSSkk....Gggkk......ggkkt....'),
    (28, '...........wGwgwk.....wGwgwt....'),
]


def hydra():
    emit(f'{OUT}/hydra.ts', 'HYDRA_SPRITE', {'K': 'black', 'G': 'green', 'g': 'midGreen', 'k': 'darkGreen', 't': 'deepTeal', 'S': 'sand', 'T': 'tan', 'r': 'hotRed', 'w': 'white', 'x': 'darkRed'}, frames(padded(HYDRA), padded(HYDRA_ATTACK)))


# ------------------------------------------------------------------ Act 2 bosses (48x48, drawn by the art reviewer)
BANDIT_KING = [
    (1, '...............................RRR..............'),
    (2, '..................bbbbbbbbbbRRRWWWWWRR..........'),
    (3, '.................bBBbbbbbbbbWWWRRRRRWWRR........'),
    (4, '................bBbbbbbbbbbebRRRrrrrrRRRR.......'),
    (5, '................Bbbbbbbbbbbberrr....RrrrR.......'),
    (6, '...............bYYYYWRYYYYYYoo........RrR.......'),
    (7, '...............booooRRooooooox..........rR......'),
    (8, '...............bbbbbbbbbbbbbbebbb........r......'),
    (9, '.........eebbbbbbbbbbbeeeeeeeeeeee..............'),
    (10, '..........eeeeeeeeeeeeeeeeeeeeee.......g........'),
    (11, '.............DDssssssssssDdddd.........gm.......'),
    (12, '.............mDeesSSseesDDdddd.........gm.......'),
    (13, '............DmSSKSSSSKSSsDddddd........LM.......'),
    (14, '............DmSSSSSSSSSSsDddddd........LM.......'),
    (15, '............mDRWRRRRRRRRRDddddd........LM.......'),
    (16, '............mDRRRRRRRRrrrDDdddd........LM.......'),
    (17, '............mDRRRRRRRRRRRDDdddd.......SSS.......'),
    (18, '...........DmDDRRRRRrrrrrDDdddddL.....SSS.......'),
    (19, '..........LDDDDDRRrrrrRDDDDdddddLL....SSs.......'),
    (20, '.........LLDDDDWLLLWLLLWLLLWLLLLLLL..DLWLW......'),
    (21, '..........LDDDDLLLMLLLMLLLMLLLMLLMM..DLLLL......'),
    (22, '..........DmDDDLLoMLLBMLLbMLLMMLLMdddDmDD.......'),
    (23, '.........DmDDDDWLBoBBBBBBbobLMdddddddDmD........'),
    (24, '.........DmDDDDWLBBoBBBBBobbLMdddddddDmD........'),
    (25, '........DmDDDDDWLxxxoYooobbbLMddddddDmDD........'),
    (26, '.......DDmDDDDDWLbbbboRobbbbLMddddddDmDD........'),
    (27, '.......DmDDDDDDWLBBBBoooBbbbLMddddddDmDD........'),
    (28, '.......DmDDDDDDWLxxxxxxxxbbbLMddddd..DD.........'),
    (29, '......WLWLLDDDDWLbbbbbbbbbbbLMddddd.............'),
    (30, '......SLLLLDDDDWLBBBYYYYBbbbLMdddddd............'),
    (31, '.....SSSDDDDDDYYYYYYYxxYYYYYYYYddddd............'),
    (32, '....oSSsDmDDDDooooooYxxYooRRRooddddd............'),
    (33, '....MYSDDmDDDDDWLBbbYYYYbbRRrLMddddd............'),
    (34, '...mWooDDmDDDDDWLBbbbbbbbbRRrLMdddddd...........'),
    (35, '..mg....mDDDDDWLDBbbbbbbbbBRRrLMddddd...........'),
    (36, '..g.....mDDDDDWLbBbbbbbbbbBRRrLMddddd...........'),
    (37, '.......DmDDDDDWLbBbbbnnbbbbBRrLMddddd...........'),
    (38, '.......DmDDDDWLDbBbbbnnbbbbBbDDLMddddd..........'),
    (39, '.......DmDDDDWLDbBbbbnnbbbbBbDDLMddddd..........'),
    (40, '.......mDDDDDWLxxxxxxxnnxxxxxxxLMddddd..........'),
    (41, '.......mDDDDDWLbbbbbbDDDbbbbbbDLMddddd..........'),
    (42, '......DmDDDDWLDeeeeeeDDDeeeeeeDdLMddddd.........'),
    (43, '......DDDDDDWLeeeeeeeDDeeeeeeeDdLMddddd.........'),
    (44, '............WLbeeeeeeeebeeeeee..WL..............'),
    (45, '............MLeeeeeeeeeeeeeeee..LM..............'),
]
BANDIT_KING_ATTACK = [
    (3, '.................................RRR............'),
    (4, '....................bbbbbbbbbbRRRWWWWWRR........'),
    (5, '...................bBBbbbbbbbbWWWRRRRRWWRR......'),
    (6, '..................bBbbbbbbbbbebRRRrrrrrRRRR.....'),
    (7, '..........LLL.....Bbbbbbbbbbbberrr....RrrrR.....'),
    (8, '......WWLL.......bYYYYWRYYYYYYoo........RrR.....'),
    (9, '.....WWW.........booooRRooooooox..........rR....'),
    (10, '...WWW...........bbbbbbbbbbbbbbebbb........r....'),
    (11, '..WWW......eebbbbbbbbbbbeeeeeeeeeeee............'),
    (12, '.WWW........eeeeeeeeeeeeeeeeeeeeee..............'),
    (13, '.WW............DDssssssssssDdddd................'),
    (14, '.WW............mDeesSSseesDDdddd................'),
    (15, '.W............DmSSKSSSSKSSsDddddd...............'),
    (16, '.W............DmSSSSSSSSSSsDddddd...............'),
    (17, '.g............mDRWRRRRRRRRRDddddd...............'),
    (18, '..gm..........mDRRRRRRRRrrrDDdddd..LL...........'),
    (19, '...gm.........mDRRRRRRRRRRRDDddddLLLLL..........'),
    (20, '....WMo......DDDDDRRRRrrrrrDDdddddLLLLL.........'),
    (21, '....YYSSWLmmmmmmmmDRrrrrRDDDDdddddMLLMM.........'),
    (22, '....oSSSLWDDDDDDDDDLLoMLLBMLLbMLLMMLLM..........'),
    (23, '.....SSsLLDDDDDDDDDWLBoBBBBBBbobLMdddd..........'),
    (24, '........LLDDDDDmDDDWLBBoBBBBBobbLMdddd..........'),
    (25, '.............DmDDDDWLxxxoYooobbbLMdddd..........'),
    (26, '.............DmDDDDWLbbbboRobbbbLMddddd.........'),
    (27, '............DDmDDDDWLBBBBoooBbbbLMddddd.........'),
    (28, '.........dDDDmDDDDDWLxxxxxxxxbbbLMddddd.........'),
    (29, '......SSSWLdDmDDDDDWLbbbbbbbbbbbLMddddd.........'),
    (30, '......SSSLLDmDDDDDDWLBBBYYYYBbbbLMdddddd........'),
    (31, '.....YSSsLLDmDDDDDYYYYYYYxxYYYYYYYYddddd........'),
    (32, '....WMo...DDmDDDDDooooooYxxYooRRRooddddd........'),
    (33, '...gm.....DmDDDDDDDWLBbbYYYYbbRRrLMddddd........'),
    (34, '..gm......DmDDDDDDWLbBbbbbbbbbRRrLMdddddd.......'),
    (35, '.g........DmDDDDDDWLBbbbbbbbbbBRRrLMddddd.......'),
    (36, '.W.......DmDDDDDDWLbBbbbbbbbbbBRRrLMddddd.......'),
    (37, '.WW......DmDDDDDDWLBbbbbbnnbbbbBRrLMddddd.......'),
    (38, '.WW......mDDDDDDWLbBbbbbbnnbbbbBbDDLMddddd......'),
    (39, '.WWW....DmDDDDDWLDBbbbbbbnnbbbbBbDDLMddddd......'),
    (40, '..WWW...DmDDDDDWLxxxxxxbbnnnxxxxxxxLMddddd......'),
    (41, '...WWWWmmDDDDDWLbbbbbbDDDDDDbbbbbbDLMddddd......'),
    (42, '.....WWDmDDDDDWLeeeeeeDDDDDDeeeeeeDdLMddddd.....'),
    (43, '.......DDDDDDWLeeeeeeeDDDDDeeeeeeeDdLMddddd.....'),
    (44, '.............WLbeeeeee....ebeeeeee..LW..........'),
    (45, '.............MLeeeeeee....eeeeeeee..LM..........'),
]


def banditKing():
    emit_boss('banditKing', 'BANDIT_KING_SPRITE', {'K': 'black', 'D': 'darkGreen', 'd': 'deepTeal', 'm': 'midGreen', 'g': 'green', 'S': 'skin', 's': 'skinShade', 'R': 'red', 'r': 'darkRed', 'B': 'brown', 'b': 'darkBrown', 'e': 'deepBrown', 'Y': 'yellow', 'o': 'gold', 'x': 'orangeBrown', 'L': 'lightGray', 'W': 'white', 'M': 'gray', 'A': 'slate', 'n': 'night'}, BANDIT_KING, BANDIT_KING_ATTACK)


ICE_QUEEN = [
    (1, '......................C.........................'),
    (2, '..............C......WB.........................'),
    (3, '....C........CWC...CWWB..C......................'),
    (4, '...CWC........C....BWWBCBB......................'),
    (5, '....C....C........WBWWBBWB......................'),
    (6, '........WBC.......WBCWBBWBCCC...................'),
    (7, '.......CWBBC....CWWBCWBBCBBCW...................'),
    (8, '......CWWBBBC...WWWWWWWCWWWWWL..................'),
    (9, '.....CCCWNNNN...LLBLLLCCLLMBMM..................'),
    (10, '......CCCNNN.....WWWWWWWWWLLLLL.................'),
    (11, '.......CCNN......WLLLLLMWWLLLLLL................'),
    (12, '........CN.......nnLnnLMWCLLLCMM................'),
    (13, '.................CnLCnLMWCLWLCMML...............'),
    (14, '.........LM.....LLLLLLLMWCLWLLCMM...............'),
    (15, '.........LM.....LLLLLLMMWCLWLLCMM...............'),
    (16, '.........LM.....LLLLLLMWWCLLWLCMML..............'),
    (17, '.........CC.....WpPLLMMWCLLLWLCMMM..............'),
    (18, '.........LM....CLMLLMMWWCLLLWLLCMM..............'),
    (19, '.........LM...LWWLLWMMWWCLLLWLLCMMM.............'),
    (20, '.........LM...LLLLLBWWWLBNMLLWLLCMM.............'),
    (21, '.........LM...LWLLLBBWWBBNMMLWLLCMM.............'),
    (22, '.........LM..LWLLBCBBWCCBNNNLLWLMCMM............'),
    (23, '.........CC..LWLLBCBBCCNBNNNaLWLLCMM............'),
    (24, '.........LMLLWLLLBCBBBBBBNNNaLLWLMCMM...........'),
    (25, '.........LMLLWLLLBCBBBBBBNNNaaLWLLCMM...........'),
    (26, '.........LMLWLLM..BCBWCCBNNNaaaLWLMCM...........'),
    (27, '.........WWLWMM...WWWCCCWWWLLaaLWLMCMM..........'),
    (28, '........WWWWMMM..BLLLCCCLLLLLaaaLWLMCM..........'),
    (29, '.........WWLMMM..BBCBCCBNBNNNaaanWLMCM..........'),
    (30, '.........LMMMMMBBBBCBNBBNBNNNaaaanLLMMM.........'),
    (31, '.........LMCCCCBBBCBNBBBNBNNNNaaannAnn..........'),
    (32, '.........LMC...BBBCBNBBBNBNNNNaaannnAn..........'),
    (33, '.........LM....BBCBWNBBBNBNNNNNaannnAn..........'),
    (34, '.........LM...BBBCWBLBBBNBBNNNNaaannAnn.........'),
    (35, '.........CC...BBBCBLBBBBNBBNNNNNaannnAn.........'),
    (36, '.........LM..BBBCBBNBBBBNBBNNNNNaannnAn.........'),
    (37, '.........LMBBBBBCBBNBBWNBBBNNNNNaaannnAn........'),
    (38, '.........LMBBBBBCBBNBWBLBBBNNNNLNaannnAn........'),
    (39, '.........LMBBBBCBBNBBBWNBBBBNNNNNaannnnAn.......'),
    (40, '.........LMBBBBCBBNBBBBNBBBBNNNNNNannnnAn.......'),
    (41, '.........CCBBBCBWBNBBBBNBBBWNNNNNNaannnnnn......'),
    (42, '.........LMBBBCWBBNBBBBNBBWBLNNNNNNannnnnn......'),
    (43, '.........LMBBBCBBNBBBBBNBBBWNNNNNNNannnnnn......'),
    (44, '.........CBBLCBLBNLBBLBNLBBLBNLNNLNaannnnnn.....'),
    (45, '........WWWWWWWWWWWWWWWWWWWWWWWWWWWWnnnn........'),
    (46, '........CLCLCLCLCLCLCLCLCLCLCLCLCLCL............'),
]
ICE_QUEEN_ATTACK = [
    (1, '........................C.......................'),
    (2, '.......................WB.......................'),
    (3, '.....................CWWB..C....................'),
    (4, '.....................BWWBCBB....................'),
    (5, '....................WBWWBBWB....................'),
    (6, '....................WBCWBBWBCCC.................'),
    (7, '..................CWWBCWBBCBBCW.................'),
    (8, '..................WWWWWWWCWWWWWL................'),
    (9, '..................LLBLLLCCLLMBMM................'),
    (10, '...................WWWWWWWWWLLLLL...............'),
    (11, '...................WLLLLLMWWLLLLLL..............'),
    (12, '...........C.......nnLnnLMWCLLLCMML.............'),
    (13, '..........CWC......CnLCnLMWCLWLCMMM.............'),
    (14, '...........C......LLLLLLLMWCLWLLCMMM............'),
    (15, '......C...........LLLLLLMMWCLWLLCMMML...........'),
    (16, '......C...........LLLLLLMWWCLLWLCMMMM...........'),
    (17, '..WC..W..WC.......WpPLLMMWCLLLWLCMMMMM..........'),
    (18, '..CC..W..CC......CLMLLMMWWCLLLWLLCMMMM..........'),
    (19, '.....CC.........LLWLLWMMWWCLLLWLLCMMMMM.........'),
    (20, '....CWB.....LLLWWWWLLBWWWLBNMLLWLLCMMMM.........'),
    (21, '....WWBBWWCWWWWLLLLLLBBWWBBNMMLWLLMCMMM.........'),
    (22, '..CCCWNNNWCLWLLLLLLBCBBWCCBNNNLLWLMCMMMM........'),
    (23, '....CCNNWWCLLWWLLLLBCBBCCNBNNNaLLWLMCMMM........'),
    (24, '.....CNNWLCLLLLMMLLBCBBBBBBNNNaLLWLLMCMMM.......'),
    (25, '......W.....LMMMMLLBCBBBBBBNNNaaLLWLMCMMM.......'),
    (26, '......W.....LMMMM...BCBWCCBNNNaaaLLWLMCMMM......'),
    (27, '..WC..W..WC.LMAML...WWWCCCWWWLLaaaLLWLMCMMM.....'),
    (28, '..CC..C..CC..MMAL..BLLLCCCLLLLLaaanLWLMCMMM.....'),
    (29, '......C......MMM..BBBCBCCBNBNNNaaannnWLMCMMM....'),
    (30, '.............CCM..BBCBBNBBNBNNNaaannnALLMMMMM...'),
    (31, '...............CCBBBCBNBBBNBNNNNaaannnAnnn......'),
    (32, '....C...........BBBCBBNBBBNBNNNNaaannnAnnn......'),
    (33, '...CWC..........BBBCBLBBBBNBNNNNNaannnnAnn......'),
    (34, '....C..........BBBCBWNWBBBNBBNNNNaannnnAnnn.....'),
    (35, '...............BBBCBBLBBBBNBBNNNNNannnnnAnn.....'),
    (36, '..............BBBCBBNBBBBBNBBNNNNNaannnnAnn.....'),
    (37, '.............BBBBCBBNBBBWNBBBNNNNNaannnnnAnn....'),
    (38, '.............BBBCBBBNBBWBLBBBNNNNLNannnnnAnn....'),
    (39, '............BBBBCBBNBBBBWNBBBBNNNNNannnnnnAnn...'),
    (40, '...........BBBBCBWBNBBBBBNBBBBNNNNNNannnnnAnn...'),
    (41, '...........BBBBCWBLBBBBBBNBBBWNNNNNNannnnnnnnn..'),
    (42, '..........BBBBCBBWNBBBBBBNBBWBLNNNNNNnnnnnnnnn..'),
    (43, '..........BBBBCBBBNBBBBBBNBBBWNNNNNNNnnnnnnnnn..'),
    (44, '.........BLBBLBBLNBLBBLBBLBBLBBLNNLNNLnnnnnnnnn.'),
    (45, '........WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWnnnn......'),
    (46, '........LCLCLCLCLCLCLCLCLCLCLCLCLCLCLC..........'),
]


def iceQueen():
    emit_boss('iceQueen', 'ICE_QUEEN_SPRITE', {'K': 'black', 'W': 'white', 'L': 'lightGray', 'M': 'gray', 'A': 'slate', 'a': 'darkSlate', 'n': 'night', 'N': 'navy', 'B': 'blue', 'C': 'cyan', 'P': 'pink', 'p': 'magenta'}, ICE_QUEEN, ICE_QUEEN_ATTACK)


ELDER_WYRM = [
    (1, '....................rrt.........................'),
    (2, '...................brr...........TR.............'),
    (3, '................brrrrr...........Ree............'),
    (4, '.............rrrrbbrrr..........ROeeeeee........'),
    (5, '...........rrbbbbrrerrr.........ROreeuuueeee....'),
    (6, '...........bbbbbreererr....TT..RORrereuuuuuuee..'),
    (7, '............beereeerbrr....TW..ROuruereruuuu....'),
    (8, '............eereeerebrr...TT...ORurrerrerrru....'),
    (9, '...........bereeeerebrr..TT...RORuuruerrerrr....'),
    (10, '..........brreeeereebrrTTT....ROuuurreuurerr....'),
    (11, '.........brbeeeeerebbrTTW.....ORuuurreuuureru...'),
    (12, '.........rbbeeeereebbTTWT....ROuuuurrreuuureu...'),
    (13, '...........beeeereeTTWWT.....ORuuuurrreuurrue...'),
    (14, '............beereeTTWTTr....Rttuuuurrrreurruue..'),
    (15, '.............bbreTTWTbTr...ttttuuuurrrrerrruuee.'),
    (16, '.............brbROOOOTTttttttRuuuuurrrrrerru....'),
    (17, '.............OOOORRRRRtttttRORuuuuurrrrrerr.....'),
    (18, '.........OOOORRRRRRRRRttttTORuuuuuuurrrreru.....'),
    (19, '........ORRRReeeeeRRRRRrrTTORuuuuuuurrrrueu.....'),
    (20, '.......RRRRRRRWYYeRRRRROTTTRuuuuuuuurrruueu.....'),
    (21, '.......ReeRRRRRRRRRRRRRTTTRRuuTuuuTuruuuuue.....'),
    (22, '.......RRRRRRRRRRrRRRTTtROT..TTuuTTuuTTuuue.....'),
    (23, '.......RRRRRRRRRWRRrrrTTRRR..TTtOTTtTTTTuuue....'),
    (24, '.......eeeeeeeeeeeeRRRRRRRRRORRRRRrOOTTtTTee....'),
    (25, '........rWrrrWrrrrrrRRrRRRrRRRrRRRRRRrOOTTT.....'),
    (26, '.........orrrrrrrrrrrRRrRRRrRRRrRRRRRRRrTTt.....'),
    (27, '..........ooooooooooRRRRRRRRRRRRRRRRRRRRrO......'),
    (28, '................rrrrRRRRrRRRrRRRrRRRORRRrr......'),
    (29, '................RORRrrrrRrRRRrRRRrOORRRRRr......'),
    (30, '................RORRRRRRRRRRRRRRRORRRRRRRRR.....'),
    (31, '................ORrRRRRreRrRRRrRORrRRRrRRRRr....'),
    (32, '...............RORRrRRRreRRrRRRrORRrRRRrRRrR....'),
    (33, '...............ORRRRRRRrerRRRRRRORRRRRRRRRrR....'),
    (34, '...............ORRRRRRRrerrrrrrrORRRrRRRrRrrR...'),
    (35, '...............ORRRrrRrrerrrrrrrRRRRRrRRRrrrR...'),
    (36, '...............ORRrRRRrYerrrrrrrRRRRRRRRRRrrrR..'),
    (37, '...............ORRRRRRroeYYYrrrrRRrRRRrRRrrrrR..'),
    (38, '...............ORRRRRRroooooYYYYrRRrRRRrrrrrrr..'),
    (39, '...............ORRRRRrooxooxooxoYYORRRRrrrrrrr..'),
    (40, '...............ORRRRRr...ooxooxooRORrRRrrrrrR...'),
    (41, '...............RRRRRrR..........OORRRrRrrrrRr...'),
    (42, '..............RRRRRRr....TT.....rORRRRrrrrRre...'),
    (43, '.............RRRRRRRr..TTTWRRRRRRORRRRrRrRre....'),
    (44, '............RRRRRRRRRTTTTtTrrrrrRRRRRRrrree.....'),
    (45, '............TRTRTrrrrr..TTteeeeeRRRRrrrrer......'),
    (46, '............W.W.W.........T....W.W.W............'),
]
ELDER_WYRM_ATTACK = [
    (1, '....................rrt.........................'),
    (2, '...................brr...........TR.............'),
    (3, '................brrrrr...........Ree............'),
    (4, '.............rrrrbbrrr..........ROeeeeee........'),
    (5, '...........rrbbbbrrerrr.........ROreeuuueeee....'),
    (6, '...........bbbbbreererr........RORrereuuuuuuee..'),
    (7, '............beereeerbrr........ROuruereruuuu....'),
    (8, '............eereeerebrr........ORurrerrerrru....'),
    (9, '...........bereeeerebrr.......RORuuruerrerrr....'),
    (10, '..........brreeeereebrr.......ROuuurreuurerr....'),
    (11, '.........brbeeeeerebbrr.......ORuuurreuuureru...'),
    (12, '.........rbbeeeereebbbrr.....ROuuuurrreuuureu...'),
    (13, '...........beeeereebbbrr.....ORuuuurrreuurrue...'),
    (14, '............beereeebbbrr....RORuuuurrrreurruue..'),
    (15, '.............bbreebbbbrr....ROuuuuurrrrerrruuee.'),
    (16, '.............brbbebbbbrr....OTTuuuurrrrrerru....'),
    (17, '..............rbbbbbbbrr...RTTWuuuurrrrrerr.....'),
    (18, '................bbbbbbrr..TTTuuuuuuurrrreru.....'),
    (19, '...................bbbbTWWTORuuuuuuurrrrueu.....'),
    (20, '...................TTTWWTTRRuuuuuuuurrruueu.....'),
    (21, '..................TTWWTTTTRRuuTuuuTuruuuuue.....'),
    (22, '............OOOOOTTWTTTrTTT..TTuuTTuuTTuuue.....'),
    (23, '........OOOORRRRRRRRTTTTTTT..tttOTTtTTTTuuue....'),
    (24, '......ORRRRRRRRRRRRRRRttttttttttRRrOOTTtTTee....'),
    (25, '.....ORRRRRRReeeeeRRRRttttttRRRRRRRRRrOOTTT.....'),
    (26, '....RReeRRRRRRWYYeRRRRRttRRRRRRRRRRRRRRrTTt.....'),
    (27, '....RRRRRRRRRRRRRRRRRRRTTRRRrRRRrRRRRRRRrO......'),
    (28, '....ORRRRRRRRRRRRRRRRTTTTrRRRrRRRrRRORRRrr......'),
    (29, '..ROOYYYYrrrrrrrrrerRRTtrrrRRRRRRROORRRRRr......'),
    (30, '..OOoYWYYWOOWOeeeeerrRTTRRRRRRrRRORRRRrRRRR.....'),
    (31, '.OOoYYYYOOOOeeeeerrrrrRrRRreRRRrORRRRRRrRRRr....'),
    (32, '.OoYWYOOOOeeeerrrrrrreRRRRreRRRRORRRRRRRRRrR....'),
    (33, '.OoWWOOOeeeerrWrrrrreRRRrRreRRRRORRRrRRRrRrR....'),
    (34, '.RoWYOeeeerrrrrrroreRrRRRrrerrrrORRRRrRRRrrrR...'),
    (35, '.OoWYeeerrWrrrrooreRRRrrRrrerrrrRRRRRRRRRRrrR...'),
    (36, '.OoYYerrrrrooooreeORRrRRRrrerrrrRRrRRRrRRRrrrR..'),
    (37, '.OoYYrWrooorreee..ORRRRRRrYerrrrRRRrRRRrRrrrrR..'),
    (38, '.OoYYroorreee.....ORRRRRRrooYYYYrRRRRRRRrrrrrr..'),
    (39, '.RooYYooOee.......ORrRRRrooxooxoYYORrRRrrrrrrr..'),
    (40, '.OOoYYYoOOO.......ORRrRRrooxooxooRORRrRrrrrrR...'),
    (41, '..OooYYooOOO......RRRRRrRRR.....OORRRRRrrrrRr...'),
    (42, '..OOooYYooOOOR...RrRRRRrTTT.....rORRRRrrrrRre...'),
    (43, '..OOOoooooOOO...RRRrRRRrTTWRRRRRRORRRRrRrRre....'),
    (44, '...OOOOooOOOR..RRRRRRRRRTtTrrrrrRRRRRRrrree.....'),
    (45, '....OOOOOOO....TRTRTrrrrrTteeeeeRRRRrrrrer......'),
    (46, '....R..........W.W.W......T....W.W.W............'),
]


def elderWyrm():
    emit_boss('elderWyrm', 'ELDER_WYRM_SPRITE', {'K': 'black', 'R': 'red', 'r': 'darkRed', 'e': 'deepBrown', 'O': 'orange', 'o': 'gold', 'Y': 'yellow', 'W': 'white', 'T': 'sand', 't': 'tan', 'x': 'orangeBrown', 'u': 'rust', 'b': 'darkBrown'}, ELDER_WYRM, ELDER_WYRM_ATTACK)


if __name__ == '__main__':
    for name in sys.argv[1:]:
        globals()[name]()
        print('wrote', name)
