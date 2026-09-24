#!/usr/bin/env python3
"""Shared CAD tracing for kiosk floor-plan SVGs."""
from __future__ import annotations

import math
import re
import shutil
import subprocess
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
NODE_CANDIDATES = (
    shutil.which("node"),
    "/home/joywang/.local/node/bin/node",
    "/usr/bin/node",
)

LAYER_Y = 24.346702
NUM = r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?"
FURN_LAYERS = {
    "A-FURN-CHAR",
    "FURNITURE",
    "F-Furniture",
    "Furniture",
    "F-CHAIR",
    "I-FURN-CHAIR",
    "I-FURN-JOIN",
    "I-FURN",
    "I-FURN LOOSE",
    "I-FURN SYSTEM",
    "FFE-FURN NEW",
    "FFE-FURN WS",
    "I-FURN-HIDD",
    "FFE-EQUIP",
    "I-EQPM",
    "FFE-Built",
    "F-FUR",
    "I-LOCKER",
    "CHAIR",
    "I-HUMAN",
}
TEXT_LAYERS = {
    "I-TEXT",
    "I-TEXT2",
    "A-ANNO-NOTE",
    "I-EQPM",
    "A-Machine",
    "TEXTS",
    "TEXT",
    "TEXT1",
}
WALL_LAYERS = {
    "I-PP WALL",
    "I-PP OPERABLE",
    "I-PP GLAZE",
    "I-WALL",
    "A-GLAZ",
    "I-GLASS-FULL",
    "GEN",
    "DOW",
    "STR",
    "STRU",
    "EDGE",
    "OPEN",
    "OPENING",
    "PP-Door",
    "WALL",
    "CWALL",
    "WINDOW",
    "WIND",
    "DOOR",
    "partitions",
    "PTTN",
}
OUTLINE_SCALE = 8


def path_bbox(d: str):
    parts = re.findall(rf"[MmLlHhVvCcSsQqTtAaZz]|{NUM}", d)
    x = y = 0.0
    minx = miny = 1e18
    maxx = maxy = -1e18

    def upd(px, py):
        nonlocal minx, miny, maxx, maxy
        minx = min(minx, px)
        miny = min(miny, py)
        maxx = max(maxx, px)
        maxy = max(maxy, py)

    cmd = None
    buf: list[str] = []

    def take(n: int):
        nonlocal buf
        vals = list(map(float, buf[:n]))
        buf = buf[n:]
        return vals

    def flush():
        nonlocal cmd, buf, x, y
        if not cmd:
            buf = []
            return
        rel = cmd.islower()
        c = cmd.upper()
        try:
            if c == "M":
                first = True
                while len(buf) >= 2:
                    nx, ny = take(2)
                    if rel:
                        nx += x
                        ny += y
                    x, y = nx, ny
                    upd(x, y)
                    if first:
                        first = False
                        c = "L"
                        rel = cmd.islower()
            elif c == "L":
                while len(buf) >= 2:
                    nx, ny = take(2)
                    if rel:
                        nx += x
                        ny += y
                    x, y = nx, ny
                    upd(x, y)
            elif c == "H":
                while buf:
                    nx = float(buf.pop(0))
                    if rel:
                        nx += x
                    x = nx
                    upd(x, y)
            elif c == "V":
                while buf:
                    ny = float(buf.pop(0))
                    if rel:
                        ny += y
                    y = ny
                    upd(x, y)
            elif c == "C":
                while len(buf) >= 6:
                    vals = take(6)
                    if rel:
                        vals = [vals[i] + (x if i % 2 == 0 else y) for i in range(6)]
                    x, y = vals[4], vals[5]
                    for i in range(0, 6, 2):
                        upd(vals[i], vals[i + 1])
            elif c in ("S", "Q"):
                while len(buf) >= 4:
                    vals = take(4)
                    if rel:
                        vals = [vals[i] + (x if i % 2 == 0 else y) for i in range(4)]
                    x, y = vals[2], vals[3]
                    for i in range(0, 4, 2):
                        upd(vals[i], vals[i + 1])
            elif c == "T":
                while len(buf) >= 2:
                    nx, ny = take(2)
                    if rel:
                        nx += x
                        ny += y
                    x, y = nx, ny
                    upd(x, y)
            elif c == "A":
                while len(buf) >= 7:
                    vals = take(7)
                    nx, ny = vals[5], vals[6]
                    if rel:
                        nx += x
                        ny += y
                    x, y = nx, ny
                    upd(x, y)
        except Exception:
            buf = []
        buf = []

    for p in parts:
        if re.match(r"[A-Za-z]", p):
            flush()
            cmd = p
            buf = []
            if p in "Zz":
                flush()
        else:
            buf.append(p)
    flush()
    if minx > maxx:
        return None
    return minx, miny, maxx, maxy


def parse_transform(tr: str | None):
    if not tr:
        return (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    if tr.startswith("matrix("):
        vals = [float(x) for x in tr[7:-1].split(",")]
        if len(vals) == 6:
            return tuple(vals)
    if tr.startswith("translate("):
        nums = [float(x) for x in re.findall(NUM, tr)]
        tx = nums[0] if nums else 0.0
        ty = nums[1] if len(nums) > 1 else 0.0
        return (1.0, 0.0, 0.0, 1.0, tx, ty)
    return (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)


def parse_matrix(tr: str | None):
    return list(parse_transform(tr))


def compose_transform(parent, child):
    a0, a1, a2, a3, a4, a5 = parent
    b0, b1, b2, b3, b4, b5 = child
    return (
        a0 * b0 + a2 * b1,
        a1 * b0 + a3 * b1,
        a0 * b2 + a2 * b3,
        a1 * b2 + a3 * b3,
        a0 * b4 + a2 * b5 + a4,
        a1 * b4 + a3 * b5 + a5,
    )


def to_page(bb, matrix):
    x0, y0, x1, y1 = bb
    if matrix:
        a, b, c, d, e, f = matrix
        pts = [(x0, y0), (x1, y0), (x0, y1), (x1, y1)]
        t = [(a * x + c * y + e, b * x + d * y + f) for x, y in pts]
        xs = [p[0] for p in t]
        ys = [p[1] for p in t]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    return x0, y0, x1, y1


def apply_pt(x: float, y: float, matrix):
    if not matrix:
        return x, y
    a, bb, c, d, e, f = matrix
    return a * x + c * y + e, bb * x + d * y + f


def path_polylines(d: str):
    parts = re.findall(rf"[MmLlHhVvCcSsQqTtAaZz]|{NUM}", d)
    x = y = 0.0
    start = None
    poly: list[tuple[float, float]] = []
    polys: list[list[tuple[float, float]]] = []
    cmd = None
    i = 0

    def emit(nx: float, ny: float):
        nonlocal x, y, poly
        if not poly or abs(poly[-1][0] - nx) > 1e-6 or abs(poly[-1][1] - ny) > 1e-6:
            poly.append((nx, ny))
        x, y = nx, ny

    while i < len(parts):
        p = parts[i]
        if re.match(r"[A-Za-z]", p):
            cmd = p
            i += 1
            if p in "Zz":
                if start and poly:
                    poly.append(start)
                    polys.append(poly)
                poly = []
                start = None
            continue
        rel = cmd.islower() if cmd else False
        c = cmd.upper() if cmd else "L"
        if c == "M":
            nx, ny = float(parts[i]), float(parts[i + 1])
            i += 2
            if rel and start is not None:
                nx += x
                ny += y
            if poly:
                polys.append(poly)
            poly = [(nx, ny)]
            x, y = nx, ny
            start = (nx, ny)
            cmd = "l" if rel else "L"
        elif c == "L":
            nx, ny = float(parts[i]), float(parts[i + 1])
            i += 2
            if rel:
                nx += x
                ny += y
            emit(nx, ny)
        elif c == "H":
            nx = float(parts[i])
            i += 1
            if rel:
                nx += x
            emit(nx, y)
        elif c == "V":
            ny = float(parts[i])
            i += 1
            if rel:
                ny += y
            emit(x, ny)
        elif c == "C":
            vals = [float(parts[i + j]) for j in range(6)]
            i += 6
            if rel:
                vals = [vals[k] + (x if k % 2 == 0 else y) for k in range(6)]
            emit(vals[4], vals[5])
        elif c in ("S", "Q"):
            vals = [float(parts[i + j]) for j in range(4)]
            i += 4
            if rel:
                vals = [vals[k] + (x if k % 2 == 0 else y) for k in range(4)]
            emit(vals[2], vals[3])
        elif c == "T":
            nx, ny = float(parts[i]), float(parts[i + 1])
            i += 2
            if rel:
                nx += x
                ny += y
            emit(nx, ny)
        elif c == "A":
            vals = [float(parts[i + j]) for j in range(7)]
            i += 7
            nx, ny = vals[5], vals[6]
            if rel:
                nx += x
                ny += y
            emit(nx, ny)
        else:
            i += 1
    if poly:
        polys.append(poly)
    return polys


def rdp(points, eps: float):
    if len(points) < 3:
        return points
    ax, ay = points[0]
    bx, by = points[-1]
    dx, dy = bx - ax, by - ay
    den = dx * dx + dy * dy or 1e-12
    maxd = -1.0
    idx = 0
    for i in range(1, len(points) - 1):
        px, py = points[i]
        t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / den))
        qx, qy = ax + t * dx, ay + t * dy
        dist = math.hypot(px - qx, py - qy)
        if dist > maxd:
            maxd = dist
            idx = i
    if maxd <= eps:
        return [points[0], points[-1]]
    return rdp(points[: idx + 1], eps)[:-1] + rdp(points[idx:], eps)


def polygon_path(pts) -> str:
    if len(pts) < 4:
        return ""
    cmds = [f"M{pts[0][0]:.2f},{pts[0][1]:.2f}"]
    for x, y in pts[1:]:
        cmds.append(f"L{x:.2f},{y:.2f}")
    cmds.append("Z")
    return " ".join(cmds)


def point_in_poly(x: float, y: float, pts) -> bool:
    inside = False
    n = len(pts)
    for i in range(n - 1 if pts[0] == pts[-1] else n):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % n]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1 + 1e-18) + x1:
            inside = not inside
    return inside


def wall_segments(raw: str):
    layer_stack: list[str] = []
    xform_stack = [(1.0, 0.0, 0.0, 1.0, 0.0, 0.0)]
    segs = []
    token_re = re.compile(r"(<g\b[^>]*>|</g>|<path\b[^>]*/>)")
    for m in token_re.finditer(raw):
        tok = m.group(1)
        if tok.startswith("<g"):
            lab = re.search(r'inkscape:label="([^"]+)"', tok)
            layer_stack.append(lab.group(1) if lab else "")
            gtr = re.search(r'\btransform="([^"]+)"', tok)
            xform_stack.append(
                compose_transform(
                    xform_stack[-1],
                    parse_transform(gtr.group(1) if gtr else None),
                )
            )
            continue
        if tok == "</g>":
            if layer_stack:
                layer_stack.pop()
            if len(xform_stack) > 1:
                xform_stack.pop()
            continue
        if not tok.startswith("<path"):
            continue
        top = next((name for name in layer_stack if name), "")
        if top not in WALL_LAYERS:
            continue
        d = re.search(r'\sd="([^"]+)"', tok)
        if not d:
            continue
        tr = re.search(r'\btransform="([^"]+)"', tok)
        matrix = compose_transform(
            xform_stack[-1],
            parse_transform(tr.group(1) if tr else None),
        )
        try:
            polys = path_polylines(d.group(1))
        except Exception:
            continue
        for poly in polys:
            pts = [apply_pt(x, y, matrix) for x, y in poly]
            if top == "PP-Door" and len(pts) >= 2:
                xs = [p[0] for p in pts]
                ys = [p[1] for p in pts]
                w, h = max(xs) - min(xs), max(ys) - min(ys)
                if min(w, h) > 8 and 0.6 < (w / (h or 1)) < 1.7:
                    continue
            for i in range(len(pts) - 1):
                a, c = pts[i], pts[i + 1]
                if (a[0] - c[0]) ** 2 + (a[1] - c[1]) ** 2 > 0.04:
                    segs.append((a, c))
    return segs


def contour_from_fill(filled: set, w: int, h: int, x0: float, y0: float):
    def val(x, y):
        return 1 if (x, y) in filled else 0

    edges = []
    for y in range(h - 1):
        for x in range(w - 1):
            tl, tr, bl, br = val(x, y), val(x + 1, y), val(x, y + 1), val(x + 1, y + 1)
            idx = tl * 8 + tr * 4 + br * 2 + bl
            t = (x + 0.5, y)
            r = (x + 1, y + 0.5)
            btm = (x + 0.5, y + 1)
            l = (x, y + 0.5)
            table = {
                0: [],
                1: [(l, btm)],
                2: [(btm, r)],
                3: [(l, r)],
                4: [(t, r)],
                5: [(l, t), (btm, r)],
                6: [(t, btm)],
                7: [(l, t)],
                8: [(l, t)],
                9: [(t, btm)],
                10: [(l, btm), (t, r)],
                11: [(t, r)],
                12: [(l, r)],
                13: [(btm, r)],
                14: [(l, btm)],
                15: [],
            }
            edges.extend(table.get(idx, []))
    adj: dict[tuple, list] = {}

    def key(p):
        return (round(p[0], 2), round(p[1], 2))

    for a, c in edges:
        adj.setdefault(key(a), []).append(key(c))
        adj.setdefault(key(c), []).append(key(a))
    if not adj:
        return []
    start = min(adj, key=lambda p: (p[1], p[0]))
    poly = [start]
    prev = None
    cur = start
    for _ in range(len(adj) + 5):
        nxt = None
        for n in adj[cur]:
            if n != prev:
                nxt = n
                break
        if nxt is None or nxt == start:
            break
        poly.append(nxt)
        prev, cur = cur, nxt
    pts = [(x0 + p[0] / OUTLINE_SCALE, y0 + p[1] / OUTLINE_SCALE) for p in poly]
    if pts and pts[0] != pts[-1]:
        pts.append(pts[0])
    return rdp(pts, 0.6)


def extract_room_outline(room: dict, segs) -> list[tuple[float, float]] | None:
    sx, sy = room["seed"]
    x0, y0, x1, y1 = room["clip"]
    w = int((x1 - x0) * OUTLINE_SCALE) + 2
    h = int((y1 - y0) * OUTLINE_SCALE) + 2
    img = Image.new("1", (w, h), 1)
    draw = ImageDraw.Draw(img)

    def px(x, y):
        return (x - x0) * OUTLINE_SCALE, (y - y0) * OUTLINE_SCALE

    for a, c in segs:
        draw.line([px(*a), px(*c)], fill=0, width=10)
    draw.rectangle([0, 0, w - 1, h - 1], outline=0, width=3)
    pix = img.load()
    fx, fy = int((sx - x0) * OUTLINE_SCALE), int((sy - y0) * OUTLINE_SCALE)
    if not (1 <= fx < w - 1 and 1 <= fy < h - 1) or pix[fx, fy] == 0:
        return None
    q = deque([(fx, fy)])
    filled = {(fx, fy)}
    while q:
        cx, cy = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in filled and pix[nx, ny] == 1:
                filled.add((nx, ny))
                q.append((nx, ny))
    # Pull the fill inside the walls so colour sits on the floor, not the CAD lines.
    shrunk = filled
    for _ in range(16):
        nxt = {
            (x, y)
            for x, y in shrunk
            if (x + 1, y) in shrunk
            and (x - 1, y) in shrunk
            and (x, y + 1) in shrunk
            and (x, y - 1) in shrunk
        }
        if len(nxt) < 80:
            break
        shrunk = nxt
    pts = contour_from_fill(shrunk, w, h, x0, y0)
    if pts and pts[0] != pts[-1]:
        pts.append(pts[0])
    return pts if len(pts) >= 4 else None


def ray_hit(sx, sy, dx, dy, segs, maxd):
    best = None
    for (x1, y1), (x2, y2) in segs:
        wx, wy = x2 - x1, y2 - y1
        den = dx * wy - dy * wx
        if abs(den) < 1e-9:
            continue
        t = ((x1 - sx) * wy - (y1 - sy) * wx) / den
        u = ((x1 - sx) * dy - (y1 - sy) * dx) / den
        if 0.4 < t < maxd and 0.0 <= u <= 1.0:
            if best is None or t < best:
                best = t
    return best


def estimate_clip(seed, capacity, segs):
    sx, sy = seed
    half = {
        1: (24, 18),
        2: (40, 42),
        4: (48, 48),
        5: (52, 52),
        6: (55, 55),
        10: (78, 62),
        12: (82, 70),
        20: (115, 95),
        24: (130, 100),
    }.get(capacity, (55, 55))
    maxd = max(half) * 2.8
    left = ray_hit(sx, sy, -1, 0, segs, maxd)
    right = ray_hit(sx, sy, 1, 0, segs, maxd)
    up = ray_hit(sx, sy, 0, -1, segs, maxd)
    down = ray_hit(sx, sy, 0, 1, segs, maxd)
    pad = 3.0
    x0 = sx - (left if left is not None else half[0]) - pad
    x1 = sx + (right if right is not None else half[0]) + pad
    y0 = sy - (up if up is not None else half[1]) - pad
    y1 = sy + (down if down is not None else half[1]) + pad
    return (x0, y0, x1, y1)


def attach_outlines(raw: str, rooms: list[dict]) -> None:
    segs = wall_segments(raw)
    for room in rooms:
        if "clip" not in room:
            room["clip"] = estimate_clip(room["seed"], room["capacity"], segs)
        pts = extract_room_outline(room, segs)
        xs = [p[0] for p in pts] if pts else []
        ys = [p[1] for p in pts] if pts else []
        too_small = not pts or (max(xs) - min(xs)) * (max(ys) - min(ys)) < 80
        if too_small:
            x0, y0, x1, y1 = room["clip"]
            room["x"] = round(x0 + 4, 2)
            room["y"] = round(y0 + 4, 2)
            room["w"] = round(max(8, x1 - x0 - 8), 2)
            room["h"] = round(max(8, y1 - y0 - 8), 2)
            room["path"] = (
                f"M{room['x']:.2f},{room['y']:.2f} "
                f"L{room['x']+room['w']:.2f},{room['y']:.2f} "
                f"L{room['x']+room['w']:.2f},{room['y']+room['h']:.2f} "
                f"L{room['x']:.2f},{room['y']+room['h']:.2f} Z"
            )
            room["labelX"] = round(room["x"] + room["w"] / 2, 2)
            room["labelY"] = round(room["y"] + room["h"] / 2, 2)
            print(f"  outline fallback rect for {room['id']} {room['w']}x{room['h']}")
            continue
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        room["x"] = round(min(xs), 2)
        room["y"] = round(min(ys), 2)
        room["w"] = round(max(xs) - min(xs), 2)
        room["h"] = round(max(ys) - min(ys), 2)
        room["path"] = polygon_path(pts)
        room["poly"] = pts
        room["labelX"] = round(room["x"] + room["w"] / 2, 2)
        room["labelY"] = round(room["y"] + room["h"] / 2, 2)
        print(f"  outline {room['id']}: {len(pts)} pts {room['w']}x{room['h']}")


def inside_rooms(rooms: list[dict], cx: float, cy: float, pad: float = -4.0) -> bool:
    for room in rooms:
        poly = room.get("poly")
        if poly:
            if point_in_poly(cx, cy, poly):
                return True
            continue
        if (
            room["x"] + pad <= cx <= room["x"] + room["w"] - pad
            and room["y"] + pad <= cy <= room["y"] + room["h"] - pad
        ):
            return True
    return False


def write_geometry_ts(path: Path, const_prefix: str, page, viewbox, rooms: list[dict]) -> None:
    lines = [
        "/** Auto-generated by scripts/build-floors.py — do not edit by hand. */",
        "",
        f"export const {const_prefix}_PAGE = {{",
        f"  width: {page[0]},",
        f"  height: {page[1]},",
        "} as const;",
        "",
        f"export const {const_prefix}_VIEWBOX = {{",
        f"  x: {viewbox['x']},",
        f"  y: {viewbox['y']},",
        f"  width: {viewbox['width']},",
        f"  height: {viewbox['height']},",
        "} as const;",
        "",
        f"export const {const_prefix}_ROOMS = [",
    ]
    for room in rooms:
        lines.append("  {")
        lines.append(f'    roomId: "{room["id"]}",')
        lines.append(f'    name: "{room["name"]}",')
        lines.append(f"    capacity: {room['capacity']},")
        lines.append(f"    x: {room['x']},")
        lines.append(f"    y: {room['y']},")
        lines.append(f"    width: {room['w']},")
        lines.append(f"    height: {room['h']},")
        lines.append(f"    labelX: {room.get('labelX', room['x'] + room['w'] / 2):.2f},")
        lines.append(f"    labelY: {room.get('labelY', room['y'] + room['h'] / 2):.2f},")
        path_d = room.get("path") or ""
        lines.append(f'    path: "{path_d}",')
        lines.append("  },")
    lines.append("] as const;")
    lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")


def rasterize_kiosk_svg(svg_path: Path) -> Path:
    """Flatten a kiosk CAD SVG to lossless WebP for fast kiosk loads."""
    node = next((item for item in NODE_CANDIDATES if item), None)
    if not node:
        raise RuntimeError("node is required to rasterize floor-plan SVGs")
    script = ROOT / "scripts" / "rasterize-floors.mjs"
    subprocess.run([node, str(script), str(svg_path)], check=True, cwd=ROOT)
    webp = svg_path.with_suffix(".webp")
    if not webp.exists():
        raise RuntimeError(f"rasterize did not write {webp}")
    return webp


def room_layer(rooms: list[dict]) -> str:
    chunks = [
        '  <g id="kiosk-meeting-rooms" inkscape:groupmode="layer" inkscape:label="KIOSK-ROOMS">'
    ]
    for room in rooms:
        path = room.get("path")
        if path:
            chunks.append(
                f'    <path id="{room["id"]}" d="{path}" fill="#ffffff" fill-opacity="0.88"/>'
            )
        else:
            chunks.append(
                f'    <rect id="{room["id"]}" x="{room["x"]:.2f}" y="{room["y"]:.2f}" '
                f'width="{room["w"]:.2f}" height="{room["h"]:.2f}" '
                'fill="#ffffff" fill-opacity="0.88"/>'
            )
    chunks.append("  </g>")
    return "\n".join(chunks)


def build_kiosk_floor(
    src: Path,
    out_svg: Path,
    out_ts: Path,
    const_prefix: str,
    viewbox: dict,
    rooms: list[dict],
) -> None:
    raw = src.read_text(encoding="utf-8")
    print(f"Tracing CAD room outlines for {const_prefix}...")
    attach_outlines(raw, rooms)
    vb = viewbox
    raw = raw.replace(
        'xmlns:svg="http://www.w3.org/2000/svg">',
        'xmlns:svg="http://www.w3.org/2000/svg" style="background:#fffcf7">\n'
        f'  <rect id="kiosk-page" x="{vb["x"]}" y="{vb["y"]}" width="{vb["width"]}" height="{vb["height"]}" fill="#fffcf7"/>',
        1,
    )
    width_m = re.search(r'\bwidth="([^"]+)"', raw)
    height_m = re.search(r'\bheight="([^"]+)"', raw)
    page_w = width_m.group(1) if width_m else "1550"
    page_h = height_m.group(1) if height_m else "1098"
    raw = re.sub(
        r'viewBox="0 0 [^"]+"',
        f'viewBox="{vb["x"]} {vb["y"]} {vb["width"]} {vb["height"]}"',
        raw,
        count=1,
    )
    raw = re.sub(r'\bwidth="[^"]+"', f'width="{vb["width"]}"', raw, count=1)
    raw = re.sub(r'\bheight="[^"]+"', f'height="{vb["height"]}"', raw, count=1)

    layer_stack: list[str] = []
    xform_stack = [(1.0, 0.0, 0.0, 1.0, 0.0, 0.0)]
    out: list[str] = []
    removed_paths = 0
    removed_text = 0
    token_re = re.compile(r"(<g\b[^>]*>|</g>|<path\b[^>]*/>|<text\b[\s\S]*?</text>)")
    last = 0
    for m in token_re.finditer(raw):
        out.append(raw[last:m.start()])
        tok = m.group(1)
        last = m.end()
        if tok.startswith("<g"):
            lab = re.search(r'inkscape:label="([^"]+)"', tok)
            layer_stack.append(lab.group(1) if lab else "")
            gtr = re.search(r'\btransform="([^"]+)"', tok)
            xform_stack.append(
                compose_transform(
                    xform_stack[-1],
                    parse_transform(gtr.group(1) if gtr else None),
                )
            )
            out.append(tok)
            continue
        if tok == "</g>":
            if layer_stack:
                layer_stack.pop()
            if len(xform_stack) > 1:
                xform_stack.pop()
            out.append(tok)
            continue
        top = next((name for name in layer_stack if name), "")
        if tok.startswith("<path") and top in FURN_LAYERS:
            d = re.search(r'\sd="([^"]+)"', tok)
            if d:
                bb = path_bbox(d.group(1))
                if bb:
                    tr = re.search(r'\btransform="([^"]+)"', tok)
                    matrix = compose_transform(
                        xform_stack[-1],
                        parse_transform(tr.group(1) if tr else None),
                    )
                    x0, y0, x1, y1 = to_page(bb, matrix)
                    if inside_rooms(rooms, (x0 + x1) / 2, (y0 + y1) / 2):
                        removed_paths += 1
                        continue
            out.append(tok)
            continue
        if tok.startswith("<text") and top in TEXT_LAYERS:
            tr = re.search(r'\btransform="([^"]+)"', tok)
            if tr:
                matrix = compose_transform(
                    xform_stack[-1],
                    parse_transform(tr.group(1)),
                )
                tx, ty = apply_pt(0, 0, matrix)
                if inside_rooms(rooms, tx, ty, pad=-8):
                    removed_text += 1
                    continue
            out.append(tok)
            continue
        out.append(tok)
    out.append(raw[last:])
    svg = "".join(out)
    svg = svg.replace("</svg>", room_layer(rooms) + "\n</svg>", 1)
    out_svg.parent.mkdir(parents=True, exist_ok=True)
    out_svg.write_text(svg, encoding="utf-8")
    write_geometry_ts(out_ts, const_prefix, (page_w, page_h), vb, rooms)
    print(f"wrote {out_svg} ({out_svg.stat().st_size / 1e6:.1f} MB)")
    print(f"removed furniture paths: {removed_paths}")
    print(f"removed labels: {removed_text}")
    print(f"wrote {out_ts}")
    rasterize_kiosk_svg(out_svg)
