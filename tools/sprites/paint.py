"""Tiny pixel painter: paint filled regions, auto-outline in black, emit SpriteDef TS files."""
import copy

W = H = 32


class Grid:
    def __init__(self):
        self.g = [['.'] * W for _ in range(H)]

    def px(self, x, y, c):
        if 0 <= x < W and 0 <= y < H:
            self.g[y][x] = c

    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.px(x, y, c)

    def hline(self, y, x0, x1, c):
        self.rect(x0, y, x1, y, c)

    def vline(self, x, y0, y1, c):
        self.rect(x, y0, x, y1, c)

    def line(self, x0, y0, x1, y1, c):
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
        err = dx + dy
        while True:
            self.px(x0, y0, c)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x0 += sx
            if e2 <= dx:
                err += dx
                y0 += sy

    def put(self, x, y, s):
        """Place a string; spaces are skipped (transparent to what is already there)."""
        for i, c in enumerate(s):
            if c != ' ':
                self.px(x + i, y, c)

    def rows(self, y0, x0, lines):
        for i, s in enumerate(lines):
            self.put(x0, y0 + i, s)

    def clear(self, x0, y0, x1, y1):
        self.rect(x0, y0, x1, y1, '.')

    def outline(self):
        src = copy.deepcopy(self.g)
        for y in range(H):
            for x in range(W):
                if src[y][x] != '.':
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < W and 0 <= ny < H and src[ny][nx] not in '.K':
                        self.g[y][x] = 'K'
                        break
        return self

    def copy(self):
        c = Grid()
        c.g = copy.deepcopy(self.g)
        return c

    def lines(self):
        return [''.join(r) for r in self.g]


def emit(path, const, legend, frames):
    used = set(''.join(''.join(f.lines()) for f in frames.values())) - {'.'}
    missing = used - set(legend)
    assert not missing, (const, missing)
    out = ["import type { SpriteDef } from '../sprite';", '', f'export const {const}: SpriteDef = {{',
           '  width: 32,', '  height: 32,', '  legend: {']
    for k, v in legend.items():
        if k in used:
            out.append(f"    {k}: '{v}',")
    out.append('  },')
    out.append('  frames: {')
    for name, f in frames.items():
        out.append(f'    {name}: [')
        out += [f"      '{r}'," for r in f.lines()]
        out.append('    ],')
    out += ['  },', '};', '']
    open(path, 'w').write('\n'.join(out))
