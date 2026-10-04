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


if __name__ == '__main__':
    for name in sys.argv[1:]:
        globals()[name]()
        print('wrote', name)
