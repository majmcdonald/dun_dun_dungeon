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

    def tint(self, cx, cy, radius, mapping):
        """Recolor what is there inside a circle (e.g. a light source warming a wall), dithered at the edge."""
        for y in range(int(cy - radius), int(cy + radius) + 1):
            for x in range(int(cx - radius), int(cx + radius) + 1):
                d = math.hypot(x - cx, y - cy) / radius
                if d > 1 or (d > 0.7 and (x + y) % 2 == 0):
                    continue
                c = self.get(x, y)
                if c in mapping:
                    self.px(x, y, mapping[c])

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


def fire(c, x, base, size=1.0):
    """A small campfire's flames standing on (x, base)."""
    for dx, h, col in ((-4, 7, 'R'), (4, 6, 'R'), (-2, 9, 'O'), (2, 8, 'O'), (0, 12, 'Y')):
        h = int(h * size)
        w = max(2, int(3 * size))
        c.poly([(x + dx * size - w, base), (x + dx * size, base - h), (x + dx * size + w, base)], col)
    c.poly([(x - 1, base), (x, base - int(6 * size)), (x + 1, base)], 'W')


def tree(s, x, ground, top, trunk='D', leaves=('g', 'e')):
    s.rect(x - 2, top + 8, x + 2, ground, trunk)
    s.ellipse(x, top + 6, 9, 8, leaves[0])
    s.ellipse(x - 2, top + 4, 6, 5, leaves[1])


def caravan():
    c = Canvas()
    c.vgradient(0, 26, ['s', 'T', 'o'])
    c.glow(40, 22, 18, ['s', 'T'])                       # low afternoon sun through the trees
    for x, y, r in ((4, 18, 10), (16, 14, 9), (54, 16, 10), (64, 22, 8), (28, 20, 7), (44, 21, 6)):
        c.ellipse(x, y, r, r - 2, 'e')                    # far treeline
    c.vgradient(27, 63, ['e', 'g', 'g'])
    c.poly([(27, 27), (37, 27), (60, 63), (4, 63)], 'b')  # the dirt road
    c.poly([(29, 27), (35, 27), (50, 63), (14, 63)], 'D')
    for x, y in ((6, 34), (58, 36), (10, 44), (56, 46), (62, 56)):
        c.rows(x, y, ['E.E', '.E.'])                      # grass tufts
    c.stamp(subject(lambda s: (tree(s, 4, 40, 0), tree(s, 60, 42, 2))))

    def wreck(s):
        s.poly([(10, 50), (14, 34), (48, 26), (50, 40)], 'B')   # cart bed on its side, upper end in the air
        s.poly([(14, 34), (48, 26), (48, 29), (14, 37)], 'T')   # lit top rail
        for i in range(1, 4):
            s.line(12 + i * 9, 49 - i * 3, 15 + i * 9, 33 - i * 2, 'b')   # planks
        s.poly([(10, 50), (50, 40), (50, 43), (10, 53)], 'b')
        s.ellipse(44, 20, 7, 7, 'b')                          # wheel spinning in the air
        s.ellipse(44, 20, 5, 5, '.')
        for a in range(0, 180, 45):
            r = math.radians(a)
            s.line(44 - math.cos(r) * 5, 20 - math.sin(r) * 5, 44 + math.cos(r) * 5, 20 + math.sin(r) * 5, 'B')
        s.ellipse(44, 20, 1, 1, 'a')
        s.rect(5, 50, 11, 52, 'N')                            # the driver's legs poking out
        s.rect(5, 54, 11, 56, 'N')
        s.rect(5, 50, 11, 50, 'U'); s.rect(5, 54, 11, 54, 'U')
        s.rect(2, 49, 4, 52, 'u'); s.rect(2, 53, 4, 56, 'u')  # boots
        s.rect(1, 52, 4, 52, 'D'); s.rect(1, 56, 4, 56, 'D')
        s.rect(46, 50, 53, 56, 'T')                           # spilled crates
        s.rect(46, 50, 53, 50, 's'); s.line(46, 50, 53, 56, 'o'); s.rect(46, 56, 53, 56, 'o')
        s.poly([(52, 41), (58, 39), (60, 45), (54, 47)], 'T')
        s.line(52, 41, 60, 45, 'o')
        s.ellipse(24, 57, 5, 3, 's')                          # sacks
        s.ellipse(22, 59, 3, 1, 'T')
        s.rect(28, 55, 29, 56, 'T')
        s.ellipse(36, 56, 4, 3, 's')
        s.ellipse(35, 58, 2, 1, 'T')
    c.stamp(subject(wreck))
    for x, y in ((31, 61), (40, 61), (42, 59), (58, 59)):
        c.px(x, y, 'R'); c.px(x + 1, y, 'R')                  # rolling apples
    return c


def witch():
    c = Canvas()
    c.vgradient(0, 47, ['D', 'D'])
    for x in range(0, SIZE, 7):                               # plank walls
        c.line(x, 0, x, 47, 'K')
        c.line(x + 1, 0, x + 1, 47, 'b')
    c.vgradient(48, 63, ['b', 'D'])
    c.rect(0, 4, 63, 6, 'b'); c.rect(0, 4, 63, 4, 'B')      # beam
    c.tint(36, 46, 26, {'D': 'b', 'b': 'B'})                 # firelight on the planks
    c.tint(36, 46, 14, {'b': 'o', 'B': 'T'})

    def herbs(s):
        for x, col, dark in ((7, 'E', 'e'), (15, 'e', 'g'), (46, 'u', 'r'), (54, 'E', 'e'), (60, 'P', 'p')):
            s.line(x, 7, x, 9, 'T')
            s.rect(x - 1, 9, x + 1, 10, 'T')                  # tied stems
            s.poly([(x - 1, 11), (x + 1, 11), (x + 4, 18), (x - 4, 18)], col)   # bundle, hanging head-down
            s.line(x - 2, 13, x - 3, 18, dark); s.line(x + 1, 13, x + 2, 18, dark)
        s.rect(26, 8, 33, 13, 'B')                            # a shelf of jars
        s.rect(26, 14, 34, 15, 'b')
        s.rect(27, 9, 28, 13, 'U'); s.rect(30, 10, 32, 13, 'R'); s.px(31, 9, 'D')
    c.stamp(subject(herbs))

    def scene(s):
        s.ellipse(36, 50, 12, 9, 'd')                         # cauldron
        s.ellipse(34, 48, 8, 5, 'a')
        s.rect(26, 56, 27, 59, 'd'); s.rect(45, 56, 46, 59, 'd')
        s.ellipse(36, 42, 12, 3, 'K')
        s.ellipse(36, 42, 10, 2, 'e')
        s.ellipse(35, 42, 6, 1, 'E')
        s.line(31, 30, 37, 42, 'B')                           # stirring stick
        # the witch: hunched, shawled, crooked nose
        s.poly([(4, 62), (8, 34), (14, 26), (22, 28), (26, 40), (24, 62)], 'p')
        s.poly([(6, 62), (9, 38), (13, 30), (12, 62)], 'P')
        s.poly([(9, 32), (25, 31), (21, 42), (16, 46), (11, 40)], 'g')   # shawl
        s.line(12, 33, 20, 42, 'e'); s.line(16, 32, 22, 38, 'e')
        s.ellipse(20, 24, 5, 5, 'k')
        s.ellipse(18, 21, 6, 4, 'l')                          # white hair
        s.rect(13, 21, 15, 30, 'l')
        s.poly([(24, 24), (28, 27), (24, 27)], 'k')           # nose
        s.px(27, 27, 'q')
        s.px(22, 23, 'K'); s.px(23, 22, 'K')
        s.rect(21, 27, 23, 27, 'q')
        s.rect(26, 31, 30, 33, 'k')                           # hand on the stick
    c.stamp(subject(scene))
    c.glow(36, 41, 6, ['E'])
    for x, y in ((33, 40), (39, 39), (36, 37), (41, 35), (34, 33), (38, 30)):
        c.px(x, y, 'E' if y < 38 else 'W')                   # bubbles and steam
    c.ellipse(32, 41, 1, 1, 'W')
    fire(c, 36, 62, 0.8)
    c.rect(27, 62, 45, 63, 'B')
    return c


def dummies():
    c = Canvas()
    c.vgradient(0, 34, ['U', 'C', 's'])
    c.glow(52, 8, 7, ['W', 's'])
    for x, y, r in ((6, 30, 10), (22, 32, 9), (60, 30, 11)):
        c.ellipse(x, y, r, 6, 'e')                            # bushes behind the fence
    c.vgradient(35, 63, ['E', 'e', 'e'])
    c.ellipse(32, 54, 34, 9, 'T')                             # trampled dirt
    c.ellipse(32, 54, 28, 6, 'o')
    for x in range(2, SIZE, 10):                              # fence
        c.rect(x, 24, x + 1, 36, 'B')
    c.rect(0, 27, 63, 28, 'B'); c.rect(0, 32, 63, 33, 'B')
    c.rect(0, 27, 63, 27, 'T'); c.rect(0, 32, 63, 32, 'T')

    def dummy(s, x, y, tilt=0):
        s.rect(x - 1, y - 30, x + 1, y, 'b')                  # post
        s.rect(x - 9, y - 22 + tilt, x + 9, y - 21 - tilt, 'b')   # arms
        s.ellipse(x, y - 16, 6, 9, 'G')                       # straw body
        s.ellipse(x + 2, y - 15, 3, 7, 'Y')
        s.rect(x - 6, y - 19, x + 6, y - 18, 's')             # rope bands
        s.rect(x - 5, y - 12, x + 5, y - 11, 's')
        s.ellipse(x, y - 29, 4, 4, 's')                       # sack head
        s.rows(x - 2, y - 30, ['K.K', '.K.', 'K.K'])          # stitched X
        s.px(x - 10, y - 21, 'Y'); s.px(x + 10, y - 22, 'Y')  # straw tufts
        s.px(x - 3, y - 6, 'Y'); s.px(x + 2, y - 7, 'Y')

    def scene(s):
        dummy(s, 12, 56)
        dummy(s, 30, 58, 1)
        s.rect(42, 34, 61, 36, 'B')                           # weapon rack
        s.rect(42, 50, 61, 52, 'B')
        s.rect(42, 34, 43, 56, 'b'); s.rect(60, 34, 61, 56, 'b')
        for i, x in enumerate((46, 51, 56)):
            s.rect(x, 26 + i % 2 * 2, x + 1, 46, 'm')          # dull blades
            s.rect(x, 26 + i % 2 * 2, x, 46, 'l')
            s.rect(x - 2, 47, x + 3, 47, 'D')
            s.rect(x, 48, x + 1, 50, 'b')
        s.px(52, 38, 'u'); s.px(47, 42, 'u')                  # rust spots
        s.rect(46, 56, 58, 58, 'r')                           # stack of old books
        s.rect(47, 59, 57, 61, 'N')
        s.rect(45, 53, 55, 55, 'e')
        s.rect(46, 56, 46, 58, 's'); s.rect(47, 59, 47, 61, 's'); s.rect(45, 53, 45, 55, 's')
    c.stamp(subject(scene))
    return c


def fairy_ring():
    c = Canvas()
    c.vgradient(0, 63, ['K', 'n', 't', 'g'])
    c.glow(32, 48, 28, ['e', 'g', 't'])
    for x, top in ((2, 0), (14, 6), (52, 4), (62, 0)):
        c.rect(x - 2, top, x + 2, 40, 'K')                    # dark trunks
    c.ellipse(4, 2, 16, 10, 'K'); c.ellipse(60, 2, 16, 10, 'K')
    c.ellipse(32, -4, 18, 8, 'K')
    c.ellipse(32, 50, 24, 8, 'E')                             # the lit ring of grass
    c.ellipse(32, 50, 19, 5, 'e')
    ring = Canvas()
    pts = [(round(32 + math.cos(math.radians(a)) * 21), round(50 + math.sin(math.radians(a)) * 7)) for a in range(0, 360, 30)]
    for i, (x, y) in enumerate(sorted(pts, key=lambda p: p[1])):
        big = y > 50
        cap = 'C' if i % 2 else 'P'
        ring.rect(x, y - (3 if big else 2), x + 1, y, 'W' if big else 'l')
        ring.ellipse(x + 0.5, y - (4 if big else 3), 3 if big else 2, 2 if big else 1, cap)
        ring.px(x, y - (5 if big else 3), 'W')
    c.stamp(ring.outline())
    for x, y, col in ((20, 30, 'Y'), (40, 26, 'Y'), (31, 20, 'W'), (12, 40, 'C'), (50, 36, 'C'), (26, 38, 'Y'),
                      (44, 42, 'W'), (35, 33, 'C'), (56, 24, 'Y'), (8, 22, 'Y'), (22, 14, 'C'), (46, 12, 'Y'),
                      (30, 44, 'W')):
        c.px(x, y, col)
        if col == 'W':
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                c.px(x + dx, y + dy, 'C')
    return c


def hermit():
    c = Canvas()
    c.vgradient(0, 63, ['n', 'd', 'd'])
    for x0, y0, x1, y1 in ((4, 6, 12, 14), (20, 2, 26, 10), (6, 30, 3, 40), (58, 8, 62, 18), (28, 14, 32, 18)):
        c.line(x0, y0, x1, y1, 'n')                           # cracks in the cave rock
    mouth = [(37, 57), (37, 42), (40, 30), (44, 23), (50, 20), (55, 23), (59, 31), (61, 42), (62, 57)]
    c.poly([(x + (1 if x > 49 else -1), y - 1) for x, y in mouth], 'K')   # jagged cave mouth onto the snow
    c.poly(mouth, 'l')
    c.poly([(38, 46), (44, 38), (50, 44), (58, 34), (61, 40), (61, 56), (38, 56)], 'W')   # snowy hills outside
    c.poly([(44, 38), (50, 44), (47, 46), (42, 42)], 'l')
    for x, y in ((44, 24), (52, 22), (48, 30), (56, 28), (45, 33), (54, 32), (41, 28)):
        c.px(x, y, 'W')                                       # falling snow
    for x, l in ((42, 3), (46, 5), (50, 4), (54, 6), (57, 3)):   # icicles on the lip
        y = {42: 27, 46: 22, 50: 20, 54: 22, 57: 27}[x]
        c.poly([(x - 1, y - 1), (x + 1, y - 1), (x, y + l)], 'C')
        c.px(x, y - 1, 'W')
    c.vgradient(56, 63, ['d', 'n'])
    c.rect(0, 56, 63, 56, 'a')
    c.poly([(0, 0), (64, 0), (64, 6), (56, 8), (50, 5), (40, 9), (34, 4), (24, 10), (16, 6), (8, 11), (0, 7)], 'K')   # rough ceiling
    for x, l in ((8, 5), (24, 4), (40, 5)):
        c.poly([(x - 2, 9), (x + 2, 9), (x, 9 + l)], 'K')
    c.tint(28, 58, 13, {'d': 'D', 'n': 'D', 'a': 'u'})       # firelight in the cold cave

    def scene(s):
        s.poly([(4, 59), (8, 36), (14, 30), (20, 36), (26, 59)], 'N')     # robe, seated cross-legged
        s.poly([(6, 59), (9, 40), (12, 36), (11, 59)], 'U')
        s.ellipse(15, 58, 12, 3, 'N')
        s.ellipse(14, 26, 6, 6, 'k')                          # head
        s.ellipse(14, 22, 6, 3, 'l')                          # white hair
        s.ellipse(14, 21, 4, 2, 'k')                          # bald crown
        s.poly([(9, 28), (19, 28), (15, 44), (13, 44)], 'W')  # long beard
        s.px(12, 26, 'K'); s.px(16, 26, 'K')
        s.rect(11, 24, 13, 24, 'W'); s.rect(15, 24, 17, 24, 'W')   # bushy brows
        s.rect(20, 42, 24, 44, 'k')                           # hand warming at the fire
        s.rect(38, 57, 46, 60, 'a')                           # flat stone
        s.ellipse(42, 54, 4, 3, 'B')                          # clay teapot
        s.ellipse(41, 53, 2, 1, 'T')
        s.rect(41, 50, 43, 51, 'b')                           # lid knob
        s.line(46, 54, 49, 51, 'B')                           # spout
        s.line(38, 52, 37, 55, 'b')                           # handle
        s.rect(22, 59, 34, 61, 'b')                           # logs
        s.line(22, 61, 34, 58, 'B')
    c.stamp(subject(scene))
    fire(c, 28, 59, 0.75)
    for x, y in ((49, 48), (50, 46), (49, 44), (50, 42)):
        c.px(x, y, 'l')                                       # steam from the spout
    return c


def hoard():
    c = Canvas()
    c.vgradient(0, 63, ['n', 't', 'n'])
    c.poly([(0, 0), (64, 0), (64, 8), (52, 12), (40, 7), (28, 11), (14, 6), (0, 10)], 'K')   # cave ceiling
    for x, l in ((8, 6), (18, 9), (30, 5), (42, 8), (54, 6)):
        y = 8 if x not in (18, 42) else 9
        c.poly([(x - 2, y), (x + 2, y), (x, y + l)], 'C')
        c.px(x - 1, y, 'W')
    # the treasure: a coin mound with a sword, goblet and crown in it
    t = Canvas()
    t.ellipse(32, 58, 30, 14, 'G')
    t.ellipse(30, 54, 20, 9, 'G')
    t.line(14, 26, 30, 52, 'm')                               # sword plunged into the coins
    t.line(15, 26, 31, 52, 'l')
    t.line(9, 32, 19, 26, 'O'); t.line(10, 32, 20, 26, 'G')   # crossguard
    t.line(11, 22, 14, 26, 'b'); t.px(10, 21, 'G')
    t.rect(38, 36, 46, 41, 'G')                               # goblet
    t.rect(38, 36, 46, 36, 'Y'); t.rect(44, 37, 45, 40, 'O')
    t.rect(41, 42, 43, 45, 'O'); t.rect(39, 46, 45, 47, 'G')
    t.px(41, 39, 'R')
    t.ellipse(32, 62, 30, 6, 'O')                             # shaded underside of the heap
    for x, y in ((8, 58), (20, 60), (44, 61), (56, 57), (34, 63)):
        t.rect(x, y, x + 2, y, 'G')
    t.rows(20, 41, ['G..G..G', 'GG.G.GG', 'GGGGGGG', 'GRGGGUG', 'OOOOOOO'])   # crown
    for x, y in ((14, 56), (24, 52), (36, 50), (48, 56), (30, 60), (40, 58), (18, 62), (54, 60), (28, 56), (44, 52)):
        t.rect(x, y, x + 1, y, 'Y')
        t.px(x, y + 1, 'O')
    c.stamp(t.outline())
    # a sheet of ice over all of it: tint, then streaks of sheen
    top = lambda x: 30 + 3 * math.sin(x / 7) + (x % 9 == 0)
    for y in range(SIZE):
        for x in range(SIZE):
            if y < top(x):
                continue
            ch = c.get(x, y)
            ice = {'n': 'N', 't': 'N', 'K': 'n', 'G': 'G', 'O': 'O', 'Y': 'W', 'l': 'C', 'm': 'U', 'b': 'N', 'R': 'P', 'U': 'C'}
            c.px(x, y, ice.get(ch, ch))
            if (x - y) % 13 in (0, 1) and (x + y) % 2 == 0:
                c.px(x, y, 'C')                              # diagonal sheen
    for x in range(SIZE):
        y = top(x)
        c.px(x, y, 'W'); c.px(x, y + 1, 'C'); c.px(x, y - 1, 'K')
    for x0, y0 in ((6, 40), (34, 34), (52, 46)):
        c.line(x0, y0, x0 + 5, y0 - 4, 'W')                   # glints
    c.line(46, 33, 40, 44, 'W'); c.line(40, 44, 44, 50, 'W')  # a crack
    return c


def bandit(s, x, y, flip=1):
    """A hooded, masked bandit standing with feet at (x, y), dagger held toward the middle."""
    s.poly([(x - 6, y - 4), (x - 5, y - 20), (x + 5, y - 20), (x + 6, y - 4)], 'b')   # body
    s.rect(x - 4, y - 3, x - 2, y, 'D'); s.rect(x + 2, y - 3, x + 4, y, 'D')
    s.poly([(x - 7, y - 4), (x - 6, y - 20), (x - 2, y - 20), (x - 3, y - 4)] if flip > 0 else
           [(x + 7, y - 4), (x + 6, y - 20), (x + 2, y - 20), (x + 3, y - 4)], 'g')   # cloak edge
    s.ellipse(x, y - 24, 6, 6, 'e')                           # hood
    s.poly([(x - 5, y - 26), (x - 2 * flip, y - 34), (x + 5, y - 26)], 'e')
    s.ellipse(x + flip, y - 23, 4, 4, 'g')                   # hood opening
    s.rect(x - 2 + flip, y - 25, x + 2 + flip, y - 24, 'k')   # eyes strip
    s.px(x - 1 + flip, y - 25, 'K'); s.px(x + 1 + flip, y - 25, 'K')
    s.rect(x - 3 + flip, y - 23, x + 3 + flip, y - 20, 'R')   # bandana mask
    s.rect(x - 3 + flip, y - 20, x + 3 + flip, y - 20, 'r')
    s.px(x - 4 * flip, y - 19, 'R'); s.px(x - 5 * flip, y - 18, 'R')   # its knot trailing
    s.rect(x - 6, y - 19, x + 6, y - 16, 'e')                 # cloak shoulders
    s.rect(x - 5, y - 10, x + 5, y - 9, 'D')                  # belt
    s.px(x, y - 10, 'G')
    hx = x + 9 * flip
    s.line(x + 5 * flip, y - 16, hx, y - 13, 'e')             # arm
    s.line(x + 5 * flip, y - 15, hx, y - 12, 'e')
    s.rect(min(hx, hx + flip), y - 13, max(hx, hx + flip), y - 12, 'k')
    s.line(hx + flip, y - 14, hx + flip, y - 15, 'G')         # guard
    s.line(hx + 2 * flip, y - 14, hx + 6 * flip, y - 20, 'W')   # dagger
    s.line(hx + 1 * flip, y - 15, hx + 5 * flip, y - 20, 'l')


def ambush():
    c = Canvas()
    c.vgradient(0, 30, ['m', 'l', 'W'])
    c.poly([(16, 31), (26, 14), (32, 8), (40, 16), (50, 31)], 'a')   # far peak
    c.poly([(26, 14), (32, 8), (36, 12), (30, 16)], 'W')
    c.vgradient(31, 63, ['l', 'm', 'a'])
    c.poly([(26, 31), (38, 31), (50, 63), (14, 63)], 'W')    # the snowy path
    c.poly([(30, 31), (34, 31), (36, 63), (28, 63)], 'l')

    def cliffs(s):
        s.poly([(-1, -1), (14, -1), (20, 20), (16, 40), (20, 64), (-1, 64)], 'd')
        s.poly([(64, -1), (50, -1), (46, 22), (50, 40), (46, 64), (64, 64)], 'd')
        s.poly([(-1, -1), (14, -1), (18, 16), (6, 8)], 'a')
        s.poly([(64, -1), (50, -1), (48, 14), (58, 8)], 'a')
        s.line(6, 20, 10, 30, 'n'); s.line(56, 24, 53, 34, 'n')
    c.stamp(subject(cliffs))
    c.stamp(subject(lambda s: (bandit(s, 15, 58, 1), bandit(s, 49, 56, -1))))

    def boulders(s):                                          # the rocks they step out from behind
        s.ellipse(4, 58, 10, 9, 'a'); s.ellipse(2, 55, 6, 4, 'm')
        s.ellipse(61, 57, 9, 9, 'a'); s.ellipse(62, 54, 5, 4, 'm')
        s.rect(0, 60, 14, 63, 'a'); s.rect(52, 60, 63, 63, 'a')
        s.rect(0, 47, 6, 48, 'W'); s.rect(58, 48, 63, 48, 'W')
    c.stamp(subject(boulders))
    return c


def totem():
    c = Canvas()
    c.vgradient(0, 63, ['K', 'n', 'd', 'n'])
    for x, w in ((4, 4), (14, 3), (50, 3), (60, 5)):
        c.rect(x - w // 2, 0, x + w // 2, 50, 'K')           # dark trees
    c.vgradient(50, 63, ['g', 't'])
    c.glow(32, 22, 20, ['t'])

    def pole(s):
        s.rect(26, 8, 38, 58, 'B')
        s.rect(26, 8, 28, 58, 'b')
        s.rect(37, 8, 38, 58, 'T')
        s.poly([(18, 14), (26, 10), (26, 18)], 'B')           # carved wings
        s.poly([(46, 14), (38, 10), (38, 18)], 'B')
        s.line(19, 14, 25, 14, 'b'); s.line(39, 14, 45, 14, 'b')
        s.poly([(28, 8), (32, 2), (36, 8)], 'B')               # beak top
        for top in (10, 26, 42):                               # three stacked faces
            s.rect(26, top + 13, 38, top + 14, 'D')            # divider groove
            s.rect(28, top + 3, 31, top + 5, 'K'); s.rect(33, top + 3, 36, top + 5, 'K')   # eye sockets
            s.rect(29, top + 9, 35, top + 11, 'K')             # mouth
            s.px(32, top + 7, 'b')
        s.rows(29, 19, ['W.W.W.W'])                            # teeth
        s.rows(29, 53, ['.W...W.'])
        s.rect(22, 58, 42, 60, 'D')
    c.stamp(subject(pole))
    for top in (10, 26, 42):
        c.rect(29, top + 4, 30, top + 4, 'E'); c.rect(34, top + 4, 35, top + 4, 'E')
        c.px(29, top + 3, 'e'); c.px(35, top + 3, 'e')
    # whisper wisps curling around the pole, fading toward their tails
    for k, (amp, y0) in enumerate(((15, 32), (13, 48), (17, 18))):
        for i in range(48):
            t = i / 60
            ang = t * 2 * math.pi + k * 2
            x = 32 + math.cos(ang) * amp
            y = y0 - t * 8 + math.sin(ang) * 3
            if math.sin(ang) < 0 and 25 <= x <= 39:
                continue
            col = 'W' if i > 42 else 'l' if i > 24 else 'm'
            if i > 24 or i % 2 == 0:
                c.px(x, y, col)
    for y in range(48, 60):                                   # ground mist
        for x in range(SIZE):
            if (x + y) % 2 == 0 and (y % 4 < 2) and c.get(x, y) in 'gtnK':
                c.px(x, y, 'a')
    return c


def sanctuary():
    c = Canvas()
    room(c, 48)
    c.tint(32, 30, 34, {'n': 'D', 'd': 'b'})                  # candlelight warming the stone
    c.tint(32, 30, 18, {'D': 'b', 'b': 'u'})

    def scene(s):
        s.ellipse(32, 14, 9, 9, 'K')                           # arched window
        s.rect(23, 14, 41, 28, 'K')
        s.ellipse(32, 14, 7, 7, 'N')
        s.rect(25, 14, 39, 27, 'N')
        s.line(32, 7, 32, 27, 'K'); s.line(25, 18, 39, 18, 'K')
        s.rect(29, 10, 30, 16, 'U'); s.rect(34, 20, 37, 25, 'p'); s.rect(26, 20, 29, 25, 'r')
        s.rect(31, 12, 33, 12, 'G'); s.rect(32, 11, 32, 15, 'G')   # a gold sigil in the glass
        s.rect(14, 38, 49, 55, 'T')                           # altar
        s.rect(14, 38, 49, 39, 's')
        s.rect(12, 36, 51, 38, 'W')                           # altar cloth
        s.rect(28, 36, 35, 50, 'R')                           # red runner
        s.rect(28, 50, 35, 50, 'G')
        s.rect(14, 51, 49, 55, 'o')
        s.rect(29, 28, 34, 35, 'G')                           # chalice
        s.rect(29, 28, 34, 28, 'Y')
        s.rect(31, 31, 32, 34, 'O')
        for x, h in ((17, 6), (21, 9), (42, 9), (46, 6)):      # candles on the altar
            s.rect(x, 36 - h, x + 1, 35, 's')
        for x in (5, 58):                                      # tall candlesticks
            s.rect(x - 1, 30, x + 1, 58, 'G')
            s.rect(x - 1, 30, x - 1, 58, 'O')
            s.rect(x - 3, 58, x + 3, 59, 'G')
            s.rect(x - 1, 22, x + 1, 29, 's')
    c.stamp(subject(scene))
    for x, top in ((17, 30), (21, 27), (42, 27), (46, 30), (5, 22), (58, 22)):
        c.px(x, top - 1, 'O'); c.px(x, top - 2, 'Y'); c.px(x, top - 3, 'Y'); c.px(x, top - 4, 'W')
    return c


def tomb():
    c = Canvas()
    room(c, 44)
    for y in range(0, 44):                                    # gloom: the wall fades out at the top
        for x in range(SIZE):
            if y < 12 or (y < 20 and (x + y) % 2 == 0):
                c.px(x, y, 'K')
    c.tint(32, 34, 24, {'n': 't', 'd': 'a'})                  # faint cold light on the tomb wall
    for x0, d in ((0, 1), (63, -1)):                          # cobwebs in the corners
        for i in range(8):
            c.px(x0 + d * i, 7 - i, 'm')
        c.line(x0, 7, x0 + d * 7, 0, 'm')
        c.line(x0 + d * 4, 0, x0 + d * 3, 3, 'm'); c.line(x0, 4, x0 + d * 3, 3, 'm')

    def box(s):
        s.rect(6, 40, 57, 58, 'a')                            # sarcophagus
        s.rect(6, 40, 8, 58, 'd')
        s.rect(55, 40, 57, 58, 'm')
        s.rect(12, 45, 51, 54, 'd')                           # carved panel
        s.rect(13, 46, 50, 53, 'a')
        s.rows(29, 47, ['..m..', '.mmm.', 'mmmmm', '..m..', '..m..'])
        s.poly([(3, 40), (8, 28), (56, 28), (61, 40)], 'm')   # lid, seen from above
        s.line(8, 28, 56, 28, 'l')
        s.rect(3, 40, 61, 41, 'd')
    c.stamp(subject(box))

    def effigy(s):
        s.rect(7, 31, 10, 36, 'a')                            # stone pillow
        s.ellipse(13, 33, 3, 3, 'l')                          # helmed head
        s.rect(11, 30, 15, 31, 'W')
        s.px(14, 33, 'm'); s.px(14, 35, 'm')
        s.rect(17, 29, 26, 37, 'l')                           # broad armored chest
        s.rect(17, 29, 26, 29, 'W')
        s.rect(27, 30, 44, 36, 'l')                           # legs
        s.line(27, 33, 44, 33, 'm')
        s.rect(17, 36, 44, 37, 'm')
        s.rect(45, 27, 47, 32, 'l'); s.rect(45, 34, 47, 39, 'l')   # feet, toes up
        s.rect(45, 27, 47, 27, 'W'); s.rect(45, 34, 47, 34, 'W')
        s.line(24, 33, 43, 33, 'W')                           # sword laid along the body
        s.rect(22, 31, 22, 35, 'G'); s.rect(19, 33, 21, 33, 'b'); s.px(18, 33, 'G')
        s.rect(19, 32, 21, 32, 'm'); s.rect(19, 34, 21, 34, 'm')   # hands clasped on the hilt
    c.stamp(subject(effigy))

    def offerings(s):
        s.ellipse(54, 48, 6, 8, 'r')                          # shield leaning on the side
        s.ellipse(54, 48, 4, 6, 'R')
        s.ellipse(54, 48, 2, 2, 'G')
        s.ellipse(14, 61, 7, 3, 'G')                          # coins
        s.rect(10, 59, 11, 59, 'Y'); s.rect(15, 60, 16, 60, 'Y'); s.rect(18, 62, 19, 62, 'Y')
        s.rect(40, 56, 44, 59, 'G'); s.rect(40, 56, 44, 56, 'Y')   # goblet
        s.rect(42, 60, 42, 61, 'G'); s.rect(40, 62, 44, 62, 'G')
        s.ellipse(28, 61, 3, 2, 'G'); s.px(27, 60, 'Y')
    c.stamp(subject(offerings))
    return c


def pact():
    c = Canvas()
    c.vgradient(0, 63, ['K', 'K', 'n'])
    c.glow(32, 22, 30, ['r', 'p', 'n', 'K'])

    def figure(s):
        s.poly([(2, 63), (10, 30), (32, 24), (54, 30), (62, 63)], 'n')   # cape
        s.poly([(4, 63), (11, 34), (16, 32), (12, 63)], 'd')
        s.poly([(10, 30), (4, 6), (24, 22)], 'r')             # high collar
        s.poly([(54, 30), (60, 6), (40, 22)], 'r')
        s.poly([(10, 30), (8, 14), (24, 24)], 'R')
        s.poly([(54, 30), (56, 14), (40, 24)], 'R')
        s.poly([(20, 63), (22, 30), (42, 30), (44, 63)], 'K')  # black coat
        s.poly([(28, 30), (36, 30), (32, 44)], 'W')           # cravat
        s.rect(31, 36, 33, 37, 'R')                           # ruby pin
        s.ellipse(32, 18, 7, 9, 'l')                          # pale face
        s.rect(25, 18, 26, 24, 'm')
        s.rect(38, 18, 39, 22, 'W')
        s.poly([(24, 14), (25, 5), (32, 7), (39, 5), (40, 14), (32, 11)], 'd')   # slicked hair, widow's peak
        s.line(26, 6, 30, 9, 'a'); s.line(38, 6, 34, 9, 'a')
        s.rect(27, 16, 29, 17, 'R'); s.rect(35, 16, 37, 17, 'R')   # red eyes
        s.px(28, 16, 'Y'); s.px(36, 16, 'Y')
        s.line(27, 14, 30, 15, 'K'); s.line(37, 14, 34, 15, 'K')   # arched brows
        s.line(27, 22, 37, 22, 'K'); s.px(26, 21, 'K'); s.px(38, 21, 'K')   # grin
        s.rect(28, 23, 36, 23, 'r')
        s.px(29, 23, 'W'); s.px(35, 23, 'W'); s.px(29, 24, 'W'); s.px(35, 24, 'W')   # fangs
        s.poly([(40, 36), (44, 33), (53, 43), (50, 46)], 'K')  # arm held out
        s.line(44, 34, 52, 43, 'd')
    c.stamp(subject(figure))

    def goblet(s):
        s.poly([(48, 30), (60, 30), (58, 37), (50, 37)], 'G')  # the offered goblet
        s.rect(48, 30, 60, 30, 'Y'); s.rect(49, 31, 59, 31, 'r')
        s.px(51, 33, 'Y'); s.rect(56, 33, 57, 36, 'O')
        s.rect(53, 38, 55, 41, 'O')
        s.rect(50, 42, 54, 45, 'l')                           # pale fingers on the stem
        s.rect(51, 46, 57, 46, 'G')
    c.stamp(subject(goblet))
    c.px(50, 31, 'R'); c.px(53, 31, 'R')
    return c


def plague():
    c = Canvas()
    c.vgradient(0, 63, ['K', 'n', 'd'])
    c.ellipse(46, 8, 5, 5, 'e')                               # a sickly moon
    c.ellipse(45, 7, 3, 3, 'E')
    c.vgradient(30, 63, ['D', 'b'])

    def dead_trees(s):
        for x, lean in ((6, -1), (58, 1)):
            s.line(x, 34, x + lean * 2, 8, 'D'); s.line(x + 1, 34, x + 1 + lean * 2, 8, 'D')
            s.line(x + lean, 18, x + lean * 8, 10, 'D')
            s.line(x + lean, 24, x - lean * 6, 16, 'D')
    c.stamp(subject(dead_trees))
    c.poly([(29, 30), (35, 30), (60, 64), (4, 64)], 'B')      # the only path, in and out of the pit
    c.poly([(31, 30), (33, 30), (40, 64), (24, 64)], 'T')
    for y in (34, 38, 56, 60):
        c.px(32 + (y % 7) - 3, y, 'b')

    def pit(s):
        s.ellipse(32, 46, 33, 10, 'D')                         # mud rim across the whole way
        s.ellipse(32, 46, 30, 8, 'g')
        s.ellipse(30, 45, 25, 6, 'e')
        s.ellipse(24, 44, 10, 2, 'E')
        s.rows(14, 48, ['l.l', '.l.'])                        # bones in the muck
        s.ellipse(9, 46, 2, 2, 'l'); s.px(8, 46, 'K')
    c.stamp(subject(pit))

    def bloat(s):
        s.ellipse(44, 43, 11, 8, 'e')                         # bloated thing heaving up out of it
        s.ellipse(38, 37, 6, 5, 'e')                          # lumpen head
        s.ellipse(51, 38, 5, 4, 'e')                          # swollen shoulder
        s.ellipse(37, 35, 3, 2, 'E'); s.ellipse(50, 36, 3, 2, 'E'); s.ellipse(44, 40, 5, 2, 'E')
        s.ellipse(46, 46, 7, 3, 'g')
        s.px(36, 37, 'Y'); s.px(40, 37, 'Y')                  # eyes
        s.rect(36, 40, 40, 41, 'K')                           # slack mouth
        s.px(37, 40, 'W')
        s.ellipse(48, 42, 1, 1, 'P'); s.ellipse(41, 46, 1, 1, 'P'); s.px(53, 40, 'P')   # sores
        s.line(53, 44, 58, 36, 'e'); s.rect(57, 34, 59, 36, 'e')   # a reaching arm
        s.rect(32, 48, 54, 49, 'e')
    c.stamp(subject(bloat))
    for x in range(30, 56):
        if x % 3:
            c.px(x, 49, 'E')                                  # muck lapping over it
    for x, y in ((14, 45), (22, 47), (28, 44), (18, 43), (58, 47)):
        c.ellipse(x, y, 1, 1, 'E'); c.px(x, y - 1, 'W')     # bubbles
    for k, x0 in enumerate((16, 26, 56)):                    # fumes
        for i in range(16):
            y = 41 - i * 1.3
            x = x0 + math.sin(i / 3 + k) * 3
            if (i + k) % 3 != 2:
                c.px(x, y, 'e' if i > 8 else 'E')
    return c


SCENES = {
    'shrine': shrine, 'chest': chest, 'merchant': merchant, 'bridge': bridge, 'goblins': goblins, 'spring': spring,
    'adventurer': adventurer, 'idol': idol, 'dice': dice, 'library': library, 'battlefield': battlefield,
    'sleepingOrc': sleeping_orc, 'portal': portal, 'mentor': mentor, 'bats': bats, 'forge': forge,
    'caravan': caravan, 'witch': witch, 'dummies': dummies, 'fairyRing': fairy_ring, 'hermit': hermit, 'hoard': hoard,
    'ambush': ambush, 'totem': totem, 'sanctuary': sanctuary, 'tomb': tomb, 'pact': pact, 'plague': plague,
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
