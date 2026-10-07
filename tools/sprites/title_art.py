"""Title-screen illustration (320x200): the party walks down a torchlit hall toward an open door where monsters lurk.

Usage: python3 tools/sprites/title_art.py [preview.png]
Writes src/art/titleArt.ts and a 3x PNG preview (default tools/out/title-art.png).
"""
import math
import os
import sys

from event_art import LEGEND as EVENT_LEGEND, palette, struct, zlib

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
W, H = 320, 200
LEGEND = dict(EVENT_LEGEND, H='hotRed')

# One-point camera: vanishing point, focal length (px per world unit at depth 1), eye height.
VX, VY, FOCAL, EYE = 160, 92, 160, 2.1
HALL = 1.8          # half-width of the hall
CEIL = 4.4          # ceiling height
FAR = 10.0          # depth of the end wall
DOOR_W, DOOR_H = 1.4, 2.4
TORCHES = [(-HALL, 2.3, 3.4, 1.0), (HALL, 2.3, 3.4, 1.0), (-HALL, 2.3, 8.0, 0.55), (HALL, 2.3, 8.0, 0.55)]
# Hero bodies for shadow casting: (X, Z, height).
BODIES = [(-0.6, 7.6, 1.6), (1.15, 6.8, 1.6), (-1.0, 6.0, 1.55)]   # knight, mage, cleric

COOL = ['K', 'n', 'd', 'a', 'm', 'l']
WARM = ['K', 'D', 'b', 'B', 'o', 'T']
FLOOR_WARM = ['K', 'D', 'b', 'B', 'o', 'T']
FLOOR_COOL = ['K', 'n', 'd', 'a', 'm', 'l']


def project(x, y, z):
    return VX + x * FOCAL / z, VY - (y - EYE) * FOCAL / z


class Canvas:
    def __init__(self, fill='.'):
        self.g = [[fill] * W for _ in range(H)]

    def px(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < W and 0 <= y < H:
            self.g[y][x] = c

    def get(self, x, y):
        return self.g[y][x] if 0 <= x < W and 0 <= y < H else '.'

    def rect(self, x0, y0, x1, y1, c):
        for y in range(int(y0), int(y1) + 1):
            for x in range(int(x0), int(x1) + 1):
                self.px(x, y, c)

    def line(self, x0, y0, x1, y1, c):
        steps = int(max(abs(x1 - x0), abs(y1 - y0), 1))
        for i in range(steps + 1):
            self.px(x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps, c)

    def ellipse(self, cx, cy, rx, ry, c):
        for y in range(int(math.floor(cy - ry)), int(math.ceil(cy + ry)) + 1):
            for x in range(int(math.floor(cx - rx)), int(math.ceil(cx + rx)) + 1):
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
        for dy, line in enumerate(lines):
            for dx, c in enumerate(line):
                if c != '.':
                    self.px(x0 + dx, y0 + dy, c)

    def glow(self, cx, cy, radius, colors, only=None):
        """Dithered rings of light, brightest at the center; `only` limits which existing colors get lit."""
        for y in range(int(cy - radius), int(cy + radius) + 1):
            for x in range(int(cx - radius), int(cx + radius) + 1):
                d = math.hypot(x - cx, y - cy) / radius
                if d > 1:
                    continue
                band = d * len(colors)
                i = int(band)
                if i >= len(colors) or (band - i > 0.5 and (x + y) % 2 == 0):
                    continue
                if only is not None and self.get(x, y) not in only:
                    continue
                self.px(x, y, colors[i])

    def stamp(self, other, mask=None):
        for y in range(H):
            for x in range(W):
                c = other.g[y][x]
                if c != '.' and (mask is None or mask(x, y)):
                    self.g[y][x] = c

    def outline(self, color='K'):
        src = [row[:] for row in self.g]
        for y in range(H):
            for x in range(W):
                if src[y][x] != '.':
                    continue
                if any(0 <= x + dx < W and 0 <= y + dy < H and src[y + dy][x + dx] != '.'
                       for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    self.g[y][x] = color
        return self

    def lines(self):
        return [''.join(r) for r in self.g]


def layer(draw, outline=True):
    s = Canvas()
    draw(s)
    return s.outline() if outline else s


# ------------------------------------------------------------------ The hall

def hash2(a, b):
    h = (a * 73856093) ^ (b * 19349663)
    h = (h ^ (h >> 13)) * 1274126177
    return (h & 0xffff) / 0xffff


def shadowed(px, pz, tx, ty, tz):
    """Is the floor point (px, 0, pz) hidden from the torch by one of the heroes?"""
    for bx, bz, bh in BODIES:
        dx, dz = tx - px, tz - pz
        L2 = dx * dx + dz * dz
        s = max(0.0, min(1.0, ((bx - px) * dx + (bz - pz) * dz) / L2))
        cx, cz = px + dx * s, pz + dz * s
        if math.hypot(cx - bx, cz - bz) < 0.22 and ty * s < bh:
            return True
    return False


def light_at(x, y, z, floor=False):
    warm = fill = 0.0
    for tx, ty, tz, power in TORCHES:
        d2 = (x - tx) ** 2 + (y - ty) ** 2 + (z - tz) ** 2
        core = power * 1.0 * math.exp(-d2 / 0.8)
        spill = power * 0.9 / (1 + d2 * 0.6)
        if floor and shadowed(x, z, tx, ty, tz):
            core *= 0.1
            spill *= 0.1
        warm += core
        fill += spill
    ambient = 0.15 * max(0.0, 1 - z / 12)
    if floor:
        warm += fill * 0.35
    return warm + fill + ambient, warm


def shade(ramp, value, x, y):
    """Pick a ramp entry for a light value, checker-dithering a thin band at each step."""
    v = max(0.0, min(len(ramp) - 1.001, value))
    i = int(v)
    f = v - i
    if 0.42 < f < 0.58 and (x + y) % 2 == 0:
        i += 1
    elif f >= 0.58:
        i += 1
    return ramp[min(i, len(ramp) - 1)]


def level(light):
    return 4.3 * (1 - math.exp(-light * 0.85))


def pick(warm, x, y, cool_ramp, warm_ramp, at=0.22):
    """Warm torchlight ramp inside the pool, cool stone outside, checker-dithered across the edge."""
    p = (warm - at * 0.6) / (at * 0.8)
    return warm_ramp if p > BAYER[y % 2][x % 2] else cool_ramp


BAYER = [[0.125, 0.625], [0.875, 0.375]]


def hall(c):
    for y in range(H):
        for x in range(W):
            dx = (x + 0.5 - VX) / FOCAL
            dy = (VY - (y + 0.5)) / FOCAL
            hits = []
            if dy < 0:
                hits.append(('floor', -EYE / dy))
            if dy > 0:
                hits.append(('ceil', (CEIL - EYE) / dy))
            if dx != 0:
                hits.append(('wall', HALL / abs(dx)))
            hits.append(('end', FAR))
            kind, z = min(hits, key=lambda h: h[1])
            X, Y = dx * z, EYE + dy * z
            pix = z / FOCAL                       # world size of one pixel at this depth
            if kind == 'floor':
                c.g[y][x] = floor_px(x, y, X, z, pix)
            elif kind == 'ceil':
                c.g[y][x] = ceil_px(x, y, X, z, pix)
            elif kind == 'wall':
                c.g[y][x] = wall_px(x, y, X, Y, z, pix)
            else:
                c.g[y][x] = end_px(x, y, X, Y, z, pix)


def rib(z):
    """Stone arch ribs span the hall at regular intervals."""
    return (z - 0.6) % 2.6 < 0.28 and z < FAR - 0.5


def wall_px(x, y, X, Y, z, pix):
    dz = z * z / (FOCAL * HALL)                     # world depth spanned by one pixel on the wall
    light, warmth = light_at(X * 0.96, Y, z)
    ramp = pick(warmth, x, y, COOL, WARM)
    lv = level(light)
    if rib(z):
        ribz = (z - 0.6) % 2.6
        if ribz < dz * 1.1 or ribz > 0.28 - dz * 1.1:
            return shade(ramp, lv - 2.2, x, y)
        course = int(Y / 0.45)
        if Y % 0.45 < pix:
            return shade(ramp, lv - 1.6, x, y)
        return shade(ramp, lv + 0.5 + (0.3 if course % 2 else 0), x, y)
    course = int(Y / 0.5)
    if Y % 0.5 < pix * 1.0:
        return shade(ramp, lv - 2.0, x, y)
    off = 0.55 * (course % 2)
    if (z + off) % 1.1 < dz:
        return shade(ramp, lv - 2.0, x, y)
    block = int((z + off) / 1.1)
    var = (hash2(block, course * 7 + (X > 0)) - 0.5) * 0.7
    # Lit upper lip on each block.
    if Y % 0.5 > 0.5 - pix * 1.2:
        var += 0.5
    return shade(ramp, lv + var, x, y)


def floor_px(x, y, X, z, pix):
    dz = z * z / (FOCAL * EYE)
    light, warmth = light_at(X, 0.0, z, floor=True)
    ramp = pick(warmth, x, y, FLOOR_COOL, FLOOR_WARM)
    lv = level(light) - 0.3
    row = int(z / 0.9)
    off = 0.45 * (row % 2)
    if z % 0.9 < dz or (X + 2 + off) % 0.9 < pix:
        return shade(ramp, lv - 1.8, x, y)
    var = (hash2(row, int((X + 2 + off) / 0.9)) - 0.5) * 0.6
    if z % 0.9 > 0.9 - dz * 1.5:
        var += 0.45                                # the near lip of each flagstone catches the light
    return shade(ramp, lv + var, x, y)


def ceil_px(x, y, X, z, pix):
    dz = z * z / (FOCAL * (CEIL - EYE))
    light, warmth = light_at(X, CEIL, z)
    ramp = pick(warmth, x, y, COOL, WARM, 0.3)
    lv = level(light) - 0.9
    if rib(z):
        ribz = (z - 0.6) % 2.6
        if ribz < dz * 1.1 or ribz > 0.28 - dz * 1.1:
            return shade(ramp, lv - 2.0, x, y)
        return shade(ramp, lv + 0.6, x, y)
    if z % 0.7 < dz or (X + 2 + 0.35 * (int(z / 0.7) % 2)) % 0.7 < pix:
        return shade(ramp, lv - 1.6, x, y)
    return shade(ramp, lv, x, y)


def end_px(x, y, X, Y, z, pix):
    light, warmth = light_at(X, Y, z - 0.6)
    ramp = pick(warmth, x, y, COOL, WARM)
    lv = level(light) - 0.2
    course = int(Y / 0.5)
    if Y % 0.5 < pix:
        return shade(ramp, lv - 2.0, x, y)
    off = 0.45 * (course % 2)
    if (X + 2 + off) % 0.9 < pix:
        return shade(ramp, lv - 2.0, x, y)
    var = (hash2(course, int((X + 2 + off) / 0.9) + 50) - 0.5) * 0.6
    return shade(ramp, lv + var, x, y)


# ------------------------------------------------------------------ The doorway

DL, DR = project(-DOOR_W / 2, 0, FAR)[0], project(DOOR_W / 2, 0, FAR)[0]
DB = project(0, 0, FAR)[1]
DT = project(0, DOOR_H, FAR)[1]
ARCH_R = (DR - DL) / 2
ARCH_CY = DT + ARCH_R
DCX = (DL + DR) / 2


def in_opening(x, y, grow=0.0):
    if y > DB + grow - 0.5 or x < DL - grow or x > DR + grow:
        return False
    if y >= ARCH_CY:
        return True
    return math.hypot(x - DCX, y - ARCH_CY) <= ARCH_R + grow


def doorway(c):
    # Voussoirs: a ring of pale lintel stones around the arch, and quoins down the jambs.
    for y in range(int(DT) - 5, int(DB) + 1):
        for x in range(int(DL) - 5, int(DR) + 6):
            if in_opening(x, y) or not in_opening(x, y, 3.6):
                continue
            if y < ARCH_CY:
                ang = math.atan2(ARCH_CY - y, x - DCX)
                seam = abs((ang / math.pi * 7) % 1) < 0.13
                c.px(x, y, 'n' if seam else ('m' if y < ARCH_CY - ARCH_R * 0.6 else 'a'))
            else:
                seam = int(y - ARCH_CY) % 6 == 0
                c.px(x, y, 'n' if seam else 'a')
    for y in range(int(DT) - 5, int(DB) + 1):         # dark inner reveal and outer edge
        for x in range(int(DL) - 5, int(DR) + 6):
            if in_opening(x, y):
                c.px(x, y, 'K')
            elif not in_opening(x, y, 3.6) and in_opening(x, y, 4.6):
                c.px(x, y, 'K' if (x + y) % 3 else 'n')
    # Threshold step.
    c.rect(DL - 4, DB, DR + 4, DB, 'a')
    c.rect(DL - 3, DB + 1, DR + 3, DB + 1, 'd')

    # The door leaf, hinged on the left jamb and swung into the dark.
    left = int(DL) + 1
    for i in range(9):
        x = left + i
        top = ARCH_CY - math.sqrt(max(0.0, ARCH_R ** 2 - (x - DCX) ** 2)) + 1 + i * 0.25
        bot = DB - 1 - i * 0.35
        for y in range(int(math.ceil(top)), int(bot) + 1):
            col = 'b' if i % 3 != 2 else 'D'
            if i == 8:
                col = 'B'
            if int(y) in (int(top) + 5, int(bot) - 6):
                col = 'n' if i < 8 else 'd'            # iron bands
            c.px(x, y, col)
    c.px(left + 6, (ARCH_CY + DB) / 2, 'G')             # ring pull


def lurkers(c):
    """A bone mage and a skeleton peering around the right side of the doorway, half hidden by the jamb."""
    jx = int(DR)
    s = Canvas()
    # Bone mage: staff leaning out over its head, purple hood, skull.
    hx, hy = jx - 4, int(ARCH_CY) + 3
    s.line(jx + 1, hy + 10, hx - 5, hy - 7, 'a')
    s.line(jx + 2, hy + 10, hx - 4, hy - 7, 'd')
    s.rows(hx - 7, hy - 10, ['.C.', 'CWC', 'CCC', '.t.'])
    s.poly([(hx - 3, hy + 4), (jx + 2, hy + 2), (jx + 2, DB), (hx + 1, DB)], 'n')     # robe
    s.line(hx - 3, hy + 4, hx, DB, 'p')
    s.ellipse(hx + 1, hy, 5.5, 6.5, 'p')                                             # hood
    s.ellipse(hx + 1.5, hy + 1, 4, 5.5, 'K')
    s.rows(hx - 2, hy - 3, [
        '.llll.',
        'lWWWWl',
        'KKlWKK',
        'HKlWHK',
        'lmlKlm',
        '.mlmlm',
        '.m.m.m',
    ])
    # Skeleton: lower down, leaning out further.
    kx, ky = jx - 8, int(ARCH_CY) + 15
    s.rows(kx, ky, [
        '..lWWWW.',
        '.lWWWWWW',
        'lWWWWWWW',
        'WKKWWKKW',
        'WHKWWHKW',
        'lWWWKWWW',
        '.lWWWWWl',
        '..lmlmlm',
        '..m.m.m.',
    ])
    s.rows(kx + 3, ky + 10, ['.lll', 'lmlml', '.l.l.'])
    for x, y in ((hx - 2, hy), (hx + 2, hy), (kx + 1, ky + 4), (kx + 5, ky + 4)):
        for ddx, ddy in ((-1, 0), (0, -1), (0, 1)):
            if s.get(x + ddx, y + ddy) == 'K':
                s.px(x + ddx, y + ddy, 'r')
    c.stamp(s, mask=lambda x, y: in_opening(x, y))
    # Bony fingers curled around the front of the jamb.
    c.rows(jx - 1, hy + 7, ['Kmll', 'lWWK', 'Kml.'])
    c.rows(jx - 1, ky + 12, ['KlWl', 'lWWK', 'Kll.'])


# ------------------------------------------------------------------ Torches

def torch(c, X, Y, Z):
    x, y = project(X, Y, Z)
    sc = FOCAL / Z / 50                                  # 1.0 for the nearest pair
    side = -1 if X < 0 else 1
    if sc > 0.6:
        # Iron bracket and wooden haft.
        c.line(x - side * 5, y + 9, x - side * 1, y + 3, 'K')
        c.line(x - side * 5, y + 10, x - side * 1, y + 4, 'n')
        c.rect(x - side * 6, y + 7, x - side * 4, y + 12, 'K')
        c.rect(x - 2, y + 1, x + 1, y + 8, 'K')
        c.rect(x - 1, y + 1, x, y + 8, 'b')
        c.rect(x - 3, y, x + 2, y + 2, 'K')
        c.rect(x - 2, y, x + 1, y + 1, 'd')
        c.rows(int(x) - 4, int(y) - 14, [
            '....R....',
            '...ROR...',
            '..ROOR.R.',
            '.ROOGOR..',
            '.ROGGOOR.',
            'ROGGYGOR.',
            'ROGYYYGOR',
            'ROGYWYGOR',
            '.OGYWYGO.',
            '.ROGYGOR.',
            '..ROGOR..',
            '...RRR...',
        ])
    else:
        c.rect(x - 1, y, x, y + 4, 'K')
        c.px(x - 1, y + 1, 'b')
        c.rows(int(x) - 2, int(y) - 6, [
            '..R..',
            '.ROR.',
            'ROGOR',
            'ROYGR',
            '.OYO.',
            '.RGR.',
        ])


# ------------------------------------------------------------------ The party, seen from behind

def knight(s, cx, fy):
    def P(x, y):
        return cx + x, fy + y
    def R(x0, y0, x1, y1, col):
        s.rect(cx + x0, fy + y0, cx + x1, fy + y1, col)
    # legs and sabatons
    R(-5, -10, -2, -1, 'a'); R(-5, -10, -5, -1, 'd'); R(-3, -10, -3, -2, 'm')
    R(2, -10, 5, -1, 'a'); R(5, -10, 5, -1, 'd'); R(3, -10, 3, -2, 'm')
    R(-5, -1, -2, 0, 'd'); R(2, -1, 5, 0, 'd')
    # tabard skirt
    s.poly([P(-7, -18), P(6, -18), P(7, -9), P(-8, -9)], 'N')
    R(-7, -10, 6, -10, 'G')
    R(-1, -17, 0, -10, 'U')
    # back plate and arms
    R(-7, -27, 6, -17, 'a')
    R(-11, -26, -8, -15, 'a'); R(-11, -26, -11, -15, 'd'); R(-10, -24, -10, -17, 'm')
    R(7, -26, 10, -16, 'a'); R(10, -26, 10, -16, 'd'); R(8, -24, 8, -18, 'm')
    R(-11, -15, -8, -12, 'd'); R(-10, -15, -9, -14, 'a')      # gauntlets
    # pauldrons
    s.ellipse(cx - 8.5, fy - 26, 3.5, 2.5, 'a'); s.rect(cx - 10, fy - 28, cx - 8, fy - 27, 'l')
    s.ellipse(cx + 7.5, fy - 26, 3.5, 2.5, 'a'); s.rect(cx + 6, fy - 28, cx + 8, fy - 27, 'm')
    R(-10, -24, 9, -24, 'd')
    # shield slung on the back: gold rim, blue field, gold cross
    s.poly([P(-6, -27), P(5, -27), P(5, -18), P(-0.5, -12), P(-6, -18)], 'G')
    s.poly([P(-5, -26), P(4, -26), P(4, -18.5), P(-0.5, -13.5), P(-5, -18.5)], 'N')
    s.poly([P(-4, -25), P(3, -25), P(3, -19), P(-0.5, -15.2), P(-4, -19)], 'U')
    R(-1, -25, 0, -15, 'G'); R(-4, -22, 3, -21, 'G'); R(-1, -22, 0, -21, 'Y')
    # helmet seen from behind and a little above, with a blue crest
    R(-3, -29, 2, -27, 'd')
    s.ellipse(cx - 0.5, fy - 32.5, 4.5, 4.5, 'a')
    s.ellipse(cx - 1.5, fy - 34, 2, 2, 'm'); s.px(cx - 2, fy - 35, 'l')
    R(3, -33, 3, -30, 'd'); R(-4, -29, 3, -29, 'd')
    R(-1, -39, 0, -29, 'U'); R(0, -37, 0, -31, 'N'); s.px(cx - 1, fy - 40, 'U'); s.px(cx, fy - 38, 'U')
    # sword in the right hand, point down and out
    R(8, -16, 10, -13, 'd'); R(8, -15, 9, -14, 'a')
    s.rect(cx + 7, fy - 13, cx + 11, fy - 13, 'G')
    s.px(cx + 9, fy - 17, 'G')
    s.line(cx + 9.6, fy - 12, cx + 13, fy - 2, 'l')
    s.line(cx + 10.6, fy - 12, cx + 14, fy - 2, 'm')
    s.px(cx + 14, fy - 1, 'l')


def cleric(s, cx, fy):
    def P(x, y):
        return cx + x, fy + y
    def R(x0, y0, x1, y1, col):
        s.rect(cx + x0, fy + y0, cx + x1, fy + y1, col)
    # robe, flaring to the hem
    s.poly([P(-5, -27), P(4, -27), P(7, -1), P(8, 0), P(-9, 0), P(-8, -1)], 's')
    s.poly([P(2, -26), P(4, -27), P(7, -1), P(8, 0), P(3, 0)], 'T')            # shaded right side
    s.poly([P(-5, -27), P(-3, -26), P(-6, 0), P(-9, 0), P(-8, -1)], 'W')      # lit left edge
    R(-9, -1, 8, 0, 'G')
    R(-8, -2, 7, -2, 'T')
    # blue stole down the back
    s.poly([P(-2, -27), P(1, -27), P(1, -3), P(-2, -3)], 'N')
    R(-1, -27, 0, -3, 'U')
    R(-2, -4, 1, -3, 'G')
    # sleeves
    s.poly([P(-5, -26), P(-8, -22), P(-10, -14), P(-6, -14), P(-4, -22)], 's')
    s.poly([P(-9, -16), P(-10, -14), P(-6, -14)], 'T')
    s.poly([P(4, -26), P(7, -22), P(9, -14), P(5, -14), P(3, -22)], 'T')
    # cowl around the shoulders
    s.ellipse(cx - 0.5, fy - 26, 5.5, 2, 'W'); R(-4, -26, 3, -25, 's')
    # head: brown hair with a gold circlet
    s.ellipse(cx - 0.5, fy - 31, 4, 4.2, 'B')
    s.ellipse(cx - 1.5, fy - 32.5, 2, 1.5, 'o')
    R(1, -31, 3, -28, 'b')
    R(-4, -31, 3, -31, 'G'); s.px(cx - 4, fy - 31, 'Y')
    s.px(cx - 5, fy - 30, 'k'); s.px(cx + 4, fy - 30, 'q')                    # ears
    # holy staff in the left hand
    s.rect(cx - 9, fy - 42, cx - 9, fy - 1, 'B')
    s.rect(cx - 8, fy - 42, cx - 8, fy - 1, 'b')
    s.rect(cx - 10, fy - 16, cx - 7, fy - 14, 'k'); s.rect(cx - 8, fy - 15, cx - 7, fy - 14, 'q')
    s.rect(cx - 9, fy - 49, cx - 8, fy - 41, 'G')
    s.rect(cx - 12, fy - 46, cx - 5, fy - 45, 'G')
    s.px(cx - 9, fy - 48, 'Y'); s.px(cx - 11, fy - 46, 'Y')


def mage(s, cx, fy):
    def P(x, y):
        return cx + x, fy + y
    def R(x0, y0, x1, y1, col):
        s.rect(cx + x0, fy + y0, cx + x1, fy + y1, col)
    # robe
    s.poly([P(-5, -26), P(4, -26), P(7, -1), P(8, 0), P(-9, 0), P(-8, -1)], 'P')
    s.poly([P(1, -25), P(4, -26), P(7, -1), P(8, 0), P(2, 0)], 'p')
    s.line(cx - 3, fy - 22, cx - 4, fy - 3, 'p')                              # fold
    s.line(cx - 6, fy - 18, cx - 7, fy - 2, 'p')
    R(-9, -1, 8, 0, 'G'); R(-8, -2, 7, -2, 'O')
    # sleeves
    s.poly([P(-5, -25), P(-8, -21), P(-10, -13), P(-6, -13), P(-4, -21)], 'P')
    s.poly([P(4, -25), P(7, -21), P(9, -13), P(5, -13), P(3, -21)], 'p')
    s.rect(cx + 5, fy - 14, cx + 8, fy - 13, 'O')
    s.rect(cx - 10, fy - 14, cx - 6, fy - 13, 'O')
    # long white hair spilling from under the hat
    s.poly([P(-4, -29), P(3, -29), P(3, -21), P(-0.5, -18), P(-4, -21)], 'l')
    s.line(cx - 2, fy - 28, cx - 2, fy - 21, 'W'); s.line(cx + 1, fy - 27, cx + 1, fy - 21, 'm')
    # pointed hat: brim, gold band, crooked cone
    s.ellipse(cx - 0.5, fy - 29.5, 7.5, 2, 'P')
    s.rect(cx - 7, fy - 29, cx + 6, fy - 28, 'p')
    s.poly([P(-4.5, -31), P(3.5, -31), P(2, -38), P(4, -44), P(6, -46), P(1, -43), P(-1.5, -38)], 'P')
    s.poly([P(1, -31), P(3.5, -31), P(2, -38), P(4, -44), P(1, -40)], 'p')
    R(-4, -32, 3, -31, 'G'); s.px(cx - 3, fy - 32, 'Y')
    # staff with a cyan orb in the right hand
    s.rect(cx + 10, fy - 37, cx + 10, fy - 1, 'B')
    s.rect(cx + 11, fy - 37, cx + 11, fy - 1, 'b')
    s.rect(cx + 8, fy - 15, cx + 11, fy - 13, 'k'); s.rect(cx + 10, fy - 14, cx + 11, fy - 13, 'q')
    s.rect(cx + 9, fy - 39, cx + 12, fy - 38, 'b')
    s.ellipse(cx + 10.5, fy - 42, 2.5, 2.5, 'C')
    s.rect(cx + 9, fy - 43, cx + 10, fy - 42, 'W')


# ------------------------------------------------------------------ Scene

def debris(c):
    """Old bones by the left wall and rubble by the right, to dress the near floor."""
    x, y = map(int, project(-1.35, 0, 4.3))
    c.stamp(layer(lambda s: (
        s.rows(x - 6, y - 5, [
            '..llll.....',
            '.lllllm....',
            '.lKlKlm....',
            '..lmlm.....',
            '...........',
        ]),
        s.line(x - 3, y - 1, x + 6, y + 1, 'm'),
        s.line(x - 3, y - 2, x + 6, y, 'l'),
        s.rows(x + 6, y - 1, ['ll', 'll']),
        s.rows(x - 4, y - 2, ['l', 'l']),
        s.line(x + 2, y + 3, x + 8, y + 3, 'a'),
        s.line(x + 2, y + 2, x + 8, y + 2, 'm'),
    )))
    x, y = map(int, project(1.4, 0, 4.8))
    c.stamp(layer(lambda s: (
        s.rows(x - 6, y - 3, [
            '....aam.',
            '..daaaam',
            '.ddaaaaa',
            '..dddda.',
        ]),
        s.rows(x - 10, y, ['.am', 'dda']),
        s.rows(x + 3, y + 1, ['am', 'da']),
    )))


def scene():
    c = Canvas()
    hall(c)
    doorway(c)
    for X, Y, Z, _ in TORCHES:
        torch(c, X * 0.97, Y, Z)
    lurkers(c)

    debris(c)
    for bx, bz, _ in BODIES:                                          # contact shadows under the party
        x, y = project(bx, 0, bz)
        c.ellipse(x, y, 7.5, 1.6, 'K')
    kx, ky = project(BODIES[0][0], 0, BODIES[0][1])
    mx, my = project(BODIES[1][0], 0, BODIES[1][1])
    cx, cy = project(BODIES[2][0], 0, BODIES[2][1])
    c.stamp(layer(lambda s: knight(s, int(kx), int(ky))))
    c.stamp(layer(lambda s: mage(s, int(mx), int(my))))
    c.stamp(layer(lambda s: cleric(s, int(cx), int(cy))))
    return c


def emit(canvas):
    rows = canvas.lines()
    assert len(rows) == H and all(len(r) == W for r in rows)
    used = sorted(set(''.join(rows)))
    assert '.' not in used, 'title art must be fully opaque'
    out = ["import type { SpriteDef } from './sprite';", '', '// Generated by tools/sprites/title_art.py.',
           'export const TITLE_ART: SpriteDef = {', f'  width: {W},', f'  height: {H},',
           '  legend: { ' + ', '.join(f"{k}: '{LEGEND[k]}'" for k in used) + ' },',
           '  frames: {', '    idle: [']
    out += [f"      '{r}'," for r in rows]
    out += ['    ],', '  },', '};', '']
    open(os.path.join(ROOT, 'src', 'art', 'titleArt.ts'), 'w').write('\n'.join(out))


def preview(canvas, path, scale=3):
    pal = palette()
    raw = bytearray()
    for row in canvas.lines():
        line = b''.join(bytes(pal[LEGEND[ch]]) * scale for ch in row)
        for _ in range(scale):
            raw += b'\x00' + line

    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    png = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', W * scale, H * scale, 8, 2, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(bytes(raw))) + chunk(b'IEND', b''))
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    open(path, 'wb').write(png)


if __name__ == '__main__':
    art = scene()
    emit(art)
    path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'tools', 'out', 'title-art.png')
    preview(art, path)
    print('ok')
