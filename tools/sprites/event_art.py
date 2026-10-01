"""Event illustrations (64x64): scenes built from shapes, dithered light, and outlined subjects.

Usage: python3 tools/sprites/event_art.py [names...]   (writes src/art/eventArt.ts and tools/out/event-<names>.png at 8x)
With no names, renders every scene.
"""
import math
import os
import re
import struct
import sys
import zlib

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
SIZE = 64
# One character per palette color used by the scenes.
LEGEND = {
    'K': 'black', 'n': 'night', 'd': 'darkSlate', 'a': 'slate', 'm': 'gray', 'l': 'lightGray', 'W': 'white',
    'D': 'deepBrown', 'b': 'darkBrown', 'B': 'brown', 'T': 'tan', 's': 'sand', 'o': 'orangeBrown', 'u': 'rust',
    'r': 'darkRed', 'R': 'red', 'O': 'orange', 'G': 'gold', 'Y': 'yellow',
    'g': 'darkGreen', 'e': 'midGreen', 'E': 'green', 't': 'deepTeal', 'N': 'navy', 'U': 'blue', 'C': 'cyan',
    'p': 'plum', 'P': 'magenta', 'k': 'skin', 'q': 'skinShade',
}


class Canvas:
    def __init__(self, fill='.'):
        self.g = [[fill] * SIZE for _ in range(SIZE)]

    def px(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < SIZE and 0 <= y < SIZE:
            self.g[y][x] = c

    def get(self, x, y):
        return self.g[y][x] if 0 <= x < SIZE and 0 <= y < SIZE else '.'

    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.px(x, y, c)

    def line(self, x0, y0, x1, y1, c):
        steps = int(max(abs(x1 - x0), abs(y1 - y0), 1))
        for i in range(steps + 1):
            self.px(x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps, c)

    def ellipse(self, cx, cy, rx, ry, c):
        for y in range(int(cy - ry), int(cy + ry) + 1):
            for x in range(int(cx - rx), int(cx + rx) + 1):
                if ((x - cx) / max(rx, 0.5)) ** 2 + ((y - cy) / max(ry, 0.5)) ** 2 <= 1:
                    self.px(x, y, c)

    def poly(self, pts, c):
        ys = [p[1] for p in pts]
        for y in range(int(min(ys)), int(max(ys)) + 1):
            xs = []
            for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1]):
                if (y0 <= y < y1) or (y1 <= y < y0):
                    xs.append(x0 + (y - y0) * (x1 - x0) / (y1 - y0))
            xs.sort()
            for a, b in zip(xs[::2], xs[1::2]):
                for x in range(int(math.ceil(a)), int(math.floor(b)) + 1):
                    self.px(x, y, c)

    def rows(self, x0, y0, lines):
        """Hand-placed detail; '.' is transparent."""
        for dy, line in enumerate(lines):
            for dx, c in enumerate(line):
                if c != '.':
                    self.px(x0 + dx, y0 + dy, c)

    def glow(self, cx, cy, radius, colors):
        """Dithered rings of light, brightest at the center, drawn over what is there."""
        for y in range(int(cy - radius), int(cy + radius) + 1):
            for x in range(int(cx - radius), int(cx + radius) + 1):
                d = math.hypot(x - cx, y - cy) / radius
                if d > 1:
                    continue
                band = d * len(colors)
                i = int(band)
                if i >= len(colors):
                    continue
                # Checker dither across each band's outer half.
                if band - i > 0.5 and (x + y) % 2 == 0:
                    continue
                self.px(x, y, colors[i])

    def vgradient(self, y0, y1, colors):
        """Background bands top to bottom, dithered at each boundary."""
        h = y1 - y0 + 1
        for y in range(y0, y1 + 1):
            t = (y - y0) / h * len(colors)
            i = min(len(colors) - 1, int(t))
            for x in range(SIZE):
                c = colors[i]
                if t - i > 0.75 and i + 1 < len(colors) and (x + y) % 2 == 0:
                    c = colors[i + 1]
                self.g[y][x] = c

    def stones(self, y0, y1, mortar, face, light):
        """A brick wall: rows of offset blocks with a lit top edge."""
        for y in range(y0, y1 + 1):
            for x in range(SIZE):
                row = (y - y0) // 6
                if (y - y0) % 6 == 0:
                    self.g[y][x] = mortar
                elif (x + (row % 2) * 7) % 14 == 0:
                    self.g[y][x] = mortar
                elif (y - y0) % 6 == 1:
                    self.g[y][x] = light
                else:
                    self.g[y][x] = face

    def stamp(self, other, dx=0, dy=0):
        for y in range(SIZE):
            for x in range(SIZE):
                c = other.g[y][x]
                if c != '.':
                    self.px(x + dx, y + dy, c)

    def outline(self, color='K'):
        src = [row[:] for row in self.g]
        for y in range(SIZE):
            for x in range(SIZE):
                if src[y][x] != '.':
                    continue
                if any(0 <= x + dx < SIZE and 0 <= y + dy < SIZE and src[y + dy][x + dx] not in '.'
                       for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    self.g[y][x] = color
        return self

    def lines(self):
        return [''.join(r) for r in self.g]


def subject(draw):
    """A layer for the scene's main object(s), outlined in black before compositing."""
    layer = Canvas()
    draw(layer)
    return layer.outline()


# ------------------------------------------------------------------ Scenes

def shrine():
    c = Canvas()
    c.stones(0, 45, 'K', 'n', 'd')
    c.vgradient(46, 63, ['D', 'b'])

    def altar(s):
        s.rect(22, 30, 41, 51, 'a')          # pillar
        s.rect(22, 30, 23, 51, 'd')          # shaded left edge
        s.rect(40, 30, 41, 51, 'm')          # lit right edge
        s.rect(18, 26, 45, 30, 'm')          # top slab
        s.rect(18, 26, 45, 26, 'l')
        s.rect(16, 52, 47, 56, 'm')          # base
        s.rect(16, 52, 47, 52, 'l')
        s.line(29, 33, 33, 41, 'd')          # crack
        s.line(33, 41, 31, 47, 'd')
        s.ellipse(32, 20, 5, 5, 'C')         # orb
        s.ellipse(31, 19, 2, 2, 'W')
        # offerings: coins and a little pot at the foot
        s.rows(17, 49, ['.GG...', 'GYGG..', '.GG...'])
        s.rows(41, 47, ['.BB.', 'BTTB', 'BTTB', '.BB.'])
    c.glow(32, 20, 13, ['t'])               # a soft teal halo behind the orb
    c.stamp(subject(altar))
    # Rays of light around the orb.
    for angle in range(0, 360, 45):
        a = math.radians(angle)
        for r in range(8, 12):
            if r % 2 == 0:
                c.px(32 + math.cos(a) * r, 20 + math.sin(a) * r, 'C')
    return c


def chest():
    c = Canvas()
    c.stones(0, 41, 'K', 'n', 'd')
    c.vgradient(42, 63, ['D', 'b', 'b'])
    c.ellipse(32, 50, 24, 4, 'D')            # shadow on the floor
    # glowing eyes in the dark behind the chest
    for x in (22, 27):
        c.rect(x, 18, x + 1, 18, 'R')
    c.px(22, 17, 'r'); c.px(28, 17, 'r')

    def box(s):
        s.rect(14, 30, 50, 49, 'B')           # body
        s.rect(14, 30, 50, 31, 'T')           # lit top edge of body
        s.poly([(14, 30), (18, 22), (46, 22), (50, 30)], 'o')   # lid
        s.line(18, 22, 46, 22, 's')
        for x in (19, 44):                   # iron bands
            s.rect(x, 22, x + 2, 49, 'a')
            s.rect(x, 22, x, 49, 'm')
        s.rect(14, 37, 50, 38, 'a')
        s.rect(29, 33, 35, 41, 'G')          # lock plate
        s.rect(31, 36, 33, 38, 'D')
        s.px(32, 39, 'D')
        s.rect(14, 45, 50, 49, 'b')          # shaded bottom
    c.stamp(subject(box))
    return c


def merchant():
    c = Canvas()
    c.stones(0, 47, 'K', 'n', 'd')
    c.vgradient(48, 63, ['D', 'b'])

    def figure(s):
        s.poly([(16, 60), (22, 26), (34, 18), (42, 26), (46, 60)], 'p')   # robe
        s.poly([(18, 60), (23, 30), (28, 26), (26, 60)], 'P')             # lit fold
        s.ellipse(32, 24, 9, 9, 'p')                                     # hood
        s.ellipse(33, 26, 5, 5, 'K')                                     # face in shadow
        s.px(31, 26, 'Y'); s.px(35, 26, 'Y')                             # glinting eyes
        s.rect(20, 40, 31, 50, 'T')                                      # box held out
        s.rect(20, 40, 31, 41, 's')
        s.rows(23, 42, ['.BBB.', 'B...B', '...B.', '..B..', '.....', '..B..'])   # question mark
        s.rect(44, 30, 47, 37, 'G')                                      # lantern
        s.rect(45, 31, 46, 36, 'Y')
        s.line(45, 26, 45, 29, 'a')
    c.stamp(subject(figure))
    c.rect(45, 32, 46, 35, 'W')              # the flame
    return c


def bridge():
    c = Canvas()
    c.vgradient(0, 63, ['n', 'n', 'K', 'K'])
    for x, y in ((8, 6), (20, 3), (50, 9), (39, 4), (58, 2), (28, 11)):
        c.px(x, y, 'a')                       # specks of distant light

    def cliffs(s):
        s.poly([(0, 26), (14, 24), (17, 30), (12, 63), (0, 63)], 'a')
        s.poly([(64, 28), (50, 26), (47, 32), (52, 63), (64, 63)], 'a')
        s.poly([(0, 26), (14, 24), (13, 27), (0, 29)], 'm')
        s.poly([(64, 28), (50, 26), (51, 29), (64, 31)], 'm')
        s.line(5, 34, 9, 46, 'd'); s.line(56, 36, 59, 50, 'd')
        # purse on the far cliff
        s.rows(54, 20, ['.BB.', '.uu.', 'GGGG', 'GYGG', '.GG.'])
    c.stamp(subject(cliffs))
    # the sagging bridge: two ropes and planks, some missing
    for x in range(15, 51):
        t = (x - 15) / 35
        y = 26 + math.sin(t * math.pi) * 9
        c.px(x, y - 6, 'T')
        c.px(x, y, 'T')
        if x % 3 == 0 and x not in (27, 30, 36, 39, 42):
            c.line(x, y, x, y + 1, 'B')
            c.px(x, y + 2, 'b')
        if x % 6 == 0:
            c.line(x, y - 6, x, y, 'b')
    return c


def room(c, floor_y):
    """Brick wall down to floor_y, then a dirt floor."""
    c.stones(0, floor_y - 1, 'K', 'n', 'd')
    c.vgradient(floor_y, SIZE - 1, ['D', 'b'])


def goblin(s, x, y, hand=False):
    """A small goblin standing with its feet at (x, y)."""
    s.rect(x - 4, y - 12, x + 4, y - 4, 'B')            # rags
    s.rect(x - 4, y - 12, x - 3, y - 4, 'b')
    s.rect(x - 3, y - 3, x - 2, y, 'e'); s.rect(x + 2, y - 3, x + 3, y, 'e')   # legs
    s.ellipse(x, y - 17, 5, 4, 'E')                      # head
    s.poly([(x - 5, y - 18), (x - 10, y - 21), (x - 4, y - 15)], 'E')          # ears
    s.poly([(x + 5, y - 18), (x + 10, y - 21), (x + 4, y - 15)], 'E')
    s.ellipse(x - 1, y - 15, 3, 1, 'e')                  # jaw shade
    s.px(x - 2, y - 18, 'Y'); s.px(x + 2, y - 18, 'Y')   # eyes
    s.rect(x - 1, y - 14, x + 1, y - 14, 'K')            # grin
    if hand:
        s.rect(x + 5, y - 10, x + 9, y - 9, 'E')         # arm out, palm up
        s.rect(x + 8, y - 11, x + 10, y - 11, 'E')


def goblins():
    c = Canvas()
    room(c, 44)
    c.stamp(subject(lambda s: (goblin(s, 14, 56), goblin(s, 32, 58, hand=True), goblin(s, 50, 56))))
    for x, y in ((40, 47), (42, 48)):
        c.px(x, y, 'G')                                   # a coin on the outstretched palm
    return c


def spring():
    c = Canvas()
    c.vgradient(0, 63, ['n', 'd', 'd'])
    c.glow(32, 44, 26, ['t', 'n'])

    def pool(s):
        s.ellipse(32, 50, 26, 9, 'a')                     # rim stones
        s.ellipse(32, 50, 22, 7, 'N')
        s.ellipse(32, 49, 18, 5, 'U')
        s.ellipse(30, 48, 9, 2, 'C')
        for x, y in ((8, 44), (52, 43), (14, 56), (48, 57)):
            s.ellipse(x, y, 5, 3, 'm')                    # boulders
            s.ellipse(x - 1, y - 1, 3, 1, 'l')
    c.stamp(subject(pool))
    for x, y in ((28, 46), (34, 44), (31, 41), (37, 47), (25, 49)):
        c.px(x, y, 'W')                                   # bubbles
    c.px(34, 40, 'C'); c.px(31, 37, 'C')
    return c


def adventurer():
    c = Canvas()
    room(c, 40)

    def scene(s):
        s.rect(10, 48, 30, 52, 'N')                       # body (blue tunic), mostly buried
        s.ellipse(9, 49, 4, 4, 'k')                       # head
        s.ellipse(9, 46, 4, 2, 'u')                       # hair
        s.px(7, 49, 'K')
        s.rect(2, 52, 8, 53, 'k')                         # reaching arm
        s.rect(1, 51, 2, 52, 'k')
        for x, y, rx, ry in ((26, 46, 9, 6), (40, 44, 10, 8), (34, 36, 7, 5), (50, 50, 9, 6), (20, 40, 6, 4)):
            s.ellipse(x, y, rx, ry, 'a')                  # fallen stones
            s.ellipse(x - 2, y - 2, rx - 4, ry - 3, 'm')
        s.rect(52, 55, 60, 61, 'B')                       # her pack
        s.rect(52, 55, 60, 56, 'T')
        s.rect(55, 57, 57, 58, 'G')
    c.stamp(subject(scene))
    return c


def idol():
    c = Canvas()
    room(c, 46)
    for x in range(0, SIZE, 8):                           # floor tiles
        c.line(x, 46, x - 4, 63, 'D')
    c.rect(36, 56, 44, 57, 'K')                           # a loose tile's gap

    def statue(s):
        s.rect(24, 34, 39, 52, 'a')                       # pedestal
        s.rect(24, 34, 39, 35, 'm')
        s.rect(24, 36, 25, 52, 'd')
        s.ellipse(32, 20, 5, 5, 'G')                      # idol head
        s.rect(28, 25, 35, 33, 'G')                       # idol body
        s.rect(27, 26, 28, 30, 'Y'); s.rect(35, 26, 36, 30, 'O')
        s.px(30, 20, 'R'); s.px(34, 20, 'R')              # ruby eyes
        s.rect(30, 16, 33, 16, 'Y')
        for x, y in ((14, 54), (20, 58), (44, 58), (50, 54), (12, 49), (52, 49)):
            s.rows(x, y, ['l.l', '.l.', 'l.l'])           # bones
        s.ellipse(48, 59, 2, 2, 'l')                      # a skull
        s.px(47, 59, 'K'); s.px(49, 59, 'K')
    c.glow(32, 24, 15, ['b'])                # warm light on the wall behind the idol
    c.stamp(subject(statue))
    for x, y in ((24, 14), (41, 18), (38, 11)):
        c.px(x, y, 'Y')                       # glints
    return c


def dice():
    c = Canvas()
    room(c, 50)

    def scene(s):
        s.ellipse(32, 14, 6, 6, 'W')                      # skull
        s.rect(29, 18, 35, 21, 'W')                       # jaw
        s.rect(29, 13, 30, 14, 'K'); s.rect(34, 13, 35, 14, 'K')
        s.px(32, 16, 'K')
        for x in (30, 32, 34):
            s.px(x, 20, 'K')
        s.rect(31, 22, 33, 34, 'l')                       # spine
        for y in (24, 27, 30):
            s.rect(25, y, 39, y, 'l')                     # ribs
        s.line(25, 24, 16, 36, 'l')                       # arm to the cup
        s.rect(12, 34, 18, 40, 'B')                       # dice cup
        s.rect(12, 34, 18, 34, 'T')
        s.rect(4, 40, 60, 44, 'B')                        # table top
        s.rect(4, 40, 60, 40, 'T')
        s.rect(8, 45, 10, 58, 'b'); s.rect(54, 45, 56, 58, 'b')
        s.rows(34, 35, ['WWWW', 'WKWW', 'WWWK', 'WWWW'])  # two dice
        s.rows(42, 36, ['WWW', 'WKW', 'WWW'])
        s.rect(50, 30, 52, 39, 's')                       # candle
        s.px(51, 28, 'Y'); s.px(51, 29, 'O')
    c.glow(51, 28, 9, ['b'])                 # candlelight on the wall
    c.stamp(subject(scene))
    return c


def library():
    c = Canvas()
    c.vgradient(0, 63, ['D', 'D', 'b'])
    spines = ['R', 'U', 'e', 'G', 'p', 'u', 'N', 'O']
    for shelf_y in (4, 20, 36):
        c.rect(0, shelf_y + 13, SIZE - 1, shelf_y + 14, 'B')       # shelf board
        x = 1
        i = shelf_y
        while x < SIZE - 1:
            w = 2 + (i * 7 + x) % 3
            h = 9 + (i + x) % 4
            color = spines[(i + x) % len(spines)]
            c.rect(x, shelf_y + 13 - h, x + w - 1, shelf_y + 12, color)
            c.line(x, shelf_y + 13 - h, x, shelf_y + 12, 'K')
            x += w + 1
            i += 3

    def lectern(s):
        s.rect(26, 52, 37, 62, 'B')
        s.rect(26, 52, 27, 62, 'b')
        s.poly([(20, 52), (24, 46), (40, 46), (44, 52)], 'B')
        s.rect(22, 43, 42, 47, 's')                        # open book
        s.line(32, 43, 32, 47, 'T')
    c.glow(32, 42, 12, ['G', 'O'])           # the warm book lights the shelves behind it
    c.stamp(subject(lectern))
    c.rect(24, 44, 31, 44, 'T'); c.rect(33, 44, 40, 44, 'T')
    c.rect(28, 41, 36, 41, 'Y')              # its glow rising off the pages
    return c


def battlefield():
    c = Canvas()
    c.vgradient(0, 40, ['n', 'd', 'a'])
    c.vgradient(41, 63, ['b', 'D'])

    def wreck(s):
        for x, top, lean in ((10, 30, 2), (24, 26, -3), (50, 28, 3)):
            s.line(x, 52, x + lean, top, 'l')             # swords stuck in the ground
            s.line(x + 1, 52, x + 1 + lean, top, 'm')
            s.rect(x - 3 + lean // 2, 46, x + 4 + lean // 2, 46, 'G')
        s.ellipse(38, 52, 7, 6, 'a')                       # round shield
        s.ellipse(38, 52, 3, 3, 'G')
        s.ellipse(18, 58, 5, 3, 'm')                       # helmet
        s.rect(15, 58, 21, 59, 'a')
        s.line(58, 20, 58, 50, 'b')                        # banner pole
        s.poly([(58, 20), (46, 22), (50, 27), (46, 32), (58, 30)], 'R')
        s.poly([(58, 26), (49, 28), (58, 30)], 'r')
    c.stamp(subject(wreck))
    return c


def sleeping_orc():
    c = Canvas()
    room(c, 48)

    def scene(s):
        s.ellipse(32, 58, 28, 9, 'G')                      # coin pile
        for x, y in ((16, 55), (24, 52), (40, 53), (48, 57), (30, 60), (36, 56), (12, 60)):
            s.px(x, y, 'Y'); s.px(x + 1, y, 'Y')
        s.ellipse(34, 44, 15, 9, 'e')                      # body
        s.ellipse(30, 44, 9, 6, 'B')                       # vest
        s.ellipse(17, 38, 7, 6, 'e')                       # head, tipped back
        s.rect(13, 37, 16, 37, 'K'); s.rect(19, 37, 21, 37, 'K')   # closed eyes
        s.px(12, 41, 'W'); s.px(14, 41, 'W')               # tusks
        s.line(46, 28, 52, 52, 'B')                        # axe haft
        s.poly([(44, 26), (54, 24), (56, 32), (46, 32)], 'l')
    c.stamp(subject(scene))
    c.rows(20, 18, ['WWW', '..W', '.W.', 'WWW'])           # Zz
    c.rows(26, 12, ['WWW', '.W.', 'WWW'])
    return c


def portal():
    c = Canvas()
    room(c, 54)

    def frame(s):
        s.ellipse(32, 30, 20, 25, 'a')                     # stone arch
        s.ellipse(32, 30, 16, 21, 'P')
        s.ellipse(32, 30, 13, 18, 'p')
        s.ellipse(32, 30, 9, 13, 'n')
    c.stamp(subject(frame))
    for i in range(70):                                    # swirling light
        t = i / 70
        r = 2 + t * 11
        a = t * 4 * math.pi
        c.px(32 + math.cos(a) * r * 0.75, 30 + math.sin(a) * r, 'C' if i % 3 else 'W')
    c.rect(30, 29, 34, 31, 'W')
    return c


def mentor():
    c = Canvas()
    c.vgradient(0, 44, ['K', 'n'])
    c.vgradient(45, 63, ['D', 'b'])
    c.glow(42, 48, 20, ['u', 'D'])

    def scene(s):
        s.rect(8, 36, 22, 54, 'a')                         # armored body, seated
        s.rect(8, 36, 10, 54, 'd')
        s.ellipse(15, 28, 6, 6, 'k')                       # head
        s.ellipse(15, 24, 6, 3, 'm')                       # grey hair
        s.poly([(10, 30), (20, 30), (15, 40)], 'l')        # long beard
        s.px(13, 28, 'K'); s.px(17, 28, 'K')
        s.line(26, 22, 26, 56, 'l')                        # sword planted in the ground
        s.rect(22, 30, 30, 31, 'G')
        s.rect(34, 54, 52, 57, 'b')                        # logs
        s.line(34, 57, 52, 53, 'B')
    c.stamp(subject(scene))
    for x, h, col in ((38, 10, 'O'), (42, 16, 'Y'), (46, 12, 'O'), (40, 6, 'R'), (48, 7, 'R')):
        c.poly([(x - 3, 54), (x, 54 - h), (x + 3, 54)], col)
    c.poly([(40, 54), (42, 44), (44, 54)], 'W')
    return c


def bats():
    c = Canvas()
    c.vgradient(0, 63, ['K', 'n', 'd'])
    c.ellipse(32, 64, 22, 18, 'n')                         # tunnel mouth glow
    bat = ['P.....P', 'PP.K.PP', '.PPKPP.', '..P.P..']
    for i, (x, y) in enumerate(((10, 8), (24, 14), (40, 6), (52, 18), (18, 26), (34, 24), (46, 34), (8, 38), (28, 40), (56, 44))):
        layer = Canvas()
        size = 1 if i % 3 else 2
        for dy, row in enumerate(bat):
            for dx, ch in enumerate(row):
                if ch != '.':
                    layer.rect(x + dx * size, y + dy * size, x + dx * size + size - 1, y + dy * size + size - 1,
                               'p' if ch == 'P' else 'K')
        layer.outline()
        c.stamp(layer)
        c.px(x + 3 * size, y + size, 'R')                   # red eye
    return c


def forge():
    c = Canvas()
    room(c, 50)

    def scene(s):
        s.rect(2, 26, 20, 56, 'a')                         # cold stone forge
        s.rect(4, 32, 18, 42, 'K')
        s.rect(6, 38, 16, 41, 'd')                         # dead coals
        s.rect(2, 26, 20, 27, 'm')
        s.rect(34, 46, 54, 50, 'd')                        # anvil
        s.rect(38, 51, 50, 57, 'd')
        s.poly([(54, 46), (60, 47), (54, 49)], 'd')
        s.rect(34, 46, 54, 46, 'a')
    c.stamp(subject(scene))
    # the ghost: drawn as a dithered see-through figure, hammer raised
    ghost = Canvas()
    ghost.ellipse(34, 18, 5, 5, 'l')
    ghost.poly([(26, 46), (30, 24), (38, 24), (42, 46)], 'l')
    ghost.line(38, 26, 48, 14, 'l')
    ghost.rect(46, 10, 52, 14, 'm')
    for y in range(SIZE):
        for x in range(SIZE):
            ch = ghost.get(x, y)
            if ch != '.' and (x + y) % 2 == 0:
                c.px(x, y, 'C' if ch == 'l' else 'l')
    c.px(32, 18, 'W'); c.px(36, 18, 'W')
    return c


SCENES = {
    'shrine': shrine, 'chest': chest, 'merchant': merchant, 'bridge': bridge, 'goblins': goblins, 'spring': spring,
    'adventurer': adventurer, 'idol': idol, 'dice': dice, 'library': library, 'battlefield': battlefield,
    'sleepingOrc': sleeping_orc, 'portal': portal, 'mentor': mentor, 'bats': bats, 'forge': forge,
}


def emit(scenes):
    out = ["import type { SpriteDef } from './sprite';", '', '// Generated by tools/sprites/event_art.py.',
           'export const EVENT_ART: Record<string, SpriteDef> = {']
    for name, canvas in scenes.items():
        rows = canvas.lines()
        used = sorted(set(''.join(rows)) - {'.'})
        missing = set(used) - set(LEGEND)
        assert not missing, (name, missing)
        out.append(f'  {name}: {{')
        out.append(f'    width: {SIZE},')
        out.append(f'    height: {SIZE},')
        out.append('    legend: { ' + ', '.join(f"{k}: '{LEGEND[k]}'" for k in used) + ' },')
        out.append('    frames: {')
        out.append('      idle: [')
        out += [f"        '{r}'," for r in rows]
        out.append('      ],')
        out.append('    },')
        out.append('  },')
    out += ['};', '']
    open(os.path.join(ROOT, 'src', 'art', 'eventArt.ts'), 'w').write('\n'.join(out))


def palette():
    src = open(os.path.join(ROOT, 'src', 'art', 'palette.ts')).read()
    return {k: tuple(int(v[i:i + 2], 16) for i in (1, 3, 5)) for k, v in re.findall(r"(\w+): '(#[0-9a-f]{6})'", src)}


def preview(scenes, path, scale=8):
    pal = palette()
    bg = (0x5a, 0x3a, 0x2f)
    cell = SIZE * scale + 16
    w, h = cell * len(scenes), cell
    px = [[bg] * w for _ in range(h)]
    for i, canvas in enumerate(scenes.values()):
        for y, row in enumerate(canvas.lines()):
            for x, ch in enumerate(row):
                if ch == '.':
                    continue
                color = pal[LEGEND[ch]]
                for sy in range(scale):
                    rowpx = px[8 + y * scale + sy]
                    base = i * cell + 8 + x * scale
                    for sx in range(scale):
                        rowpx[base + sx] = color
    raw = b''.join(b'\x00' + bytes(v for p in row for v in p) for row in px)

    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    png = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b''))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'wb').write(png)


if __name__ == '__main__':
    all_scenes = {name: draw() for name, draw in SCENES.items()}
    emit(all_scenes)
    names = sys.argv[1:] or list(SCENES)
    preview({n: all_scenes[n] for n in names}, os.path.join(ROOT, 'tools', 'out', f"event-{'-'.join(names)}.png"))
    print('ok')
