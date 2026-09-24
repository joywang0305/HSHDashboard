#!/usr/bin/env python3
"""Build a kiosk POT14F SVG: empty bookable rooms with fillable plates and large names."""
from __future__ import annotations

import math
import re
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "floorplans" / "20260828_HSH Project HOME_14F The Peninsula Office Tower_Testfit 03.svg"
OUT_SVG = ROOT / "public" / "floorplans" / "pot14f.svg"
OUT_TS = ROOT / "src" / "lib" / "pot14f-geometry.ts"

LAYER_Y = 24.346702
NUM = r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?"
FURN_LAYERS = {
    "A-FURN-CHAR",
    "FURNITURE",
    "F-Furniture",
    "I-FURN-CHAIR",
    "I-FURN-JOIN",
    "I-FURN",
    "I-FURN LOOSE",
    "I-FURN SYSTEM",
    "FFE-FURN NEW",
    "I-FURN-HIDD",
    "FFE-EQUIP",
    "I-EQPM",
    "FFE-Built",
    "F-FUR",
}
TEXT_LAYERS = {"I-TEXT", "A-ANNO-NOTE", "I-EQPM", "A-Machine"}
WALL_LAYERS = {
    "I-PP WALL",
    "I-PP OPERABLE",
    "I-WALL",
    "A-GLAZ",
    "GEN",
    "DOW",
    "STR",
    "EDGE",
    "OPEN",
    "PP-Door",
}
OUTLINE_SCALE = 8

# Seeds sit inside each room. Clips cut through the bounding walls so the
# occupancy fill follows the CAD outline instead of a drawn rectangle.
ROOMS = [
    {
        "id": "pot14-meeting-west",
        "name": "West Meeting",
        "capacity": 8,
        "x": 161.0,
        "y": 345.5,
        "w": 71.9,
        "h": 102.5,
        "seed": (197.0, 397.0),
        "clip": (159.2, 334.0, 234.5, 450.2),
    },
    {
        "id": "pot14-meeting-north",
        "name": "North Meeting",
        "capacity": 8,
        "x": 414.0,
        "y": 272.2,
        "w": 99.9,
        "h": 96.5,
        "seed": (464.0, 320.0),
        "clip": (413.5, 271.8, 515.2, 370.5),
    },
    {
        "id": "pot14-meeting-east",
        "name": "East Meeting",
        "capacity": 7,
        "x": 1166.0,
        "y": 345.5,
        "w": 90.6,
        "h": 102.5,
        "seed": (1211.0, 395.0),
        "clip": (1165.5, 334.0, 1258.2, 450.2),
    },
    {
        "id": "pot14-phone-west",
        "name": "West Phone",
        "capacity": 2,
        "x": 161.0,
        "y": 451.8,
        "w": 71.9,
        "h": 76.6,
        "seed": (197.0, 490.0),
        "clip": (159.2, 450.2, 234.5, 530.0),
    },
    {
        "id": "pot14-phone-east",
        "name": "East Phone",
        "capacity": 2,
        "x": 1166.0,
        "y": 451.8,
        "w": 90.6,
        "h": 76.6,
        "seed": (1212.0, 490.0),
        "clip": (1165.5, 450.2, 1258.2, 530.0),
    },
    {
        "id": "pot14-phone-booth-n",
        "name": "North Booth",
        "capacity": 1,
        "x": 578.8,
        "y": 414.8,
        "w": 41.4,
        "h": 25.8,
        "seed": (600.8, 426.7),
        "clip": (578.0, 414.0, 621.5, 442.0),
    },
    {
        "id": "pot14-phone-booth-e",
        "name": "East Booth",
        "capacity": 1,
        "x": 1127.8,
        "y": 550.0,
        "w": 25.2,
        "h": 23.5,
        "seed": (1131.2, 563.0),
        "clip": (1127.2, 549.5, 1154.0, 574.8),
    },
    {
        "id": "pot14-phone-south-a",
        "name": "Phone A",
        "capacity": 2,
        "x": 628.0,
        "y": 574.1,
        "w": 39.2,
        "h": 23.4,
        "seed": (647.6, 585.8),
        "clip": (627.5, 573.5, 668.2, 598.5),
    },
    {
        "id": "pot14-phone-south-b",
        "name": "Phone B",
        "capacity": 2,
        "x": 750.5,
        "y": 574.1,
        "w": 39.3,
        "h": 23.4,
        "seed": (770.2, 585.8),
        "clip": (749.9, 573.5, 790.8, 598.5),
    },
]


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


def parse_matrix(tr: str | None):
    if not tr or not tr.startswith("matrix"):
        return None
    return [float(x) for x in tr[7:-1].split(",")]


def to_page(bb, matrix):
    x0, y0, x1, y1 = bb
    if matrix:
        a, b, c, d, e, f = matrix
        pts = [(x0, y0), (x1, y0), (x0, y1), (x1, y1)]
        t = [(a * x + c * y + e, b * x + d * y + f) for x, y in pts]
        xs = [p[0] for p in t]
        ys = [p[1] for p in t]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    return x0, y0 - LAYER_Y, x1, y1 - LAYER_Y


def apply_pt(x: float, y: float, matrix):
    if matrix:
        a, bb, c, d, e, f = matrix
        x, y = a * x + c * y + e, bb * x + d * y + f
    return x, y - LAYER_Y


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
    segs = []
    token_re = re.compile(r"(<g\b[^>]*>|</g>|<path\b[^>]*/>)")
    for m in token_re.finditer(raw):
        tok = m.group(1)
        if tok.startswith("<g"):
            lab = re.search(r'inkscape:label="([^"]+)"', tok)
            layer_stack.append(lab.group(1) if lab else "")
            continue
        if tok == "</g>":
            if layer_stack:
                layer_stack.pop()
            continue
        if not tok.startswith("<path"):
            continue
        top = next((name for name in layer_stack if name), "")
        if top not in WALL_LAYERS:
            continue
        d = re.search(r'\sd="([^"]+)"', tok)
        if not d:
            continue
        tr = re.search(r'transform="([^"]+)"', tok)
        matrix = parse_matrix(tr.group(1) if tr else None)
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
        draw.line([px(*a), px(*c)], fill=0, width=4)
    draw.rectangle([0, 0, w - 1, h - 1], outline=0)
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
    for _ in range(8):
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


def attach_outlines(raw: str) -> None:
    segs = wall_segments(raw)
    for room in ROOMS:
        pts = extract_room_outline(room, segs)
        if not pts:
            print(f"  outline fallback rect for {room['id']}")
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


def inside_room(cx: float, cy: float, pad: float = -4.0) -> bool:
    for room in ROOMS:
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


def write_geometry_ts() -> None:
    lines = [
        "/** Auto-generated by scripts/build-pot14f.py — do not edit by hand. */",
        "",
        "export const POT14F_PAGE = {",
        "  width: 1550.2733,",
        "  height: 1098.3199,",
        "} as const;",
        "",
        "/** Cropped to the architectural plate (layer 0) so the drawing fills the kiosk card. */",
        "export const POT14F_VIEWBOX = {",
        "  x: 148,",
        "  y: 259,",
        "  width: 1127,",
        "  height: 454,",
        "} as const;",
        "",
        "export const POT14F_ROOMS = [",
    ]
    for room in ROOMS:
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
        path = room.get("path") or ""
        lines.append(f'    path: "{path}",')
        lines.append("  },")
    lines.append("] as const;")
    lines.append("")
    OUT_TS.write_text("\n".join(lines), encoding="utf-8")


def room_layer() -> str:
    chunks = [
        '  <g id="kiosk-meeting-rooms" inkscape:groupmode="layer" inkscape:label="KIOSK-ROOMS">'
    ]
    for room in ROOMS:
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


def process() -> None:
    raw = SRC.read_text(encoding="utf-8")
    print("Tracing CAD room outlines...")
    attach_outlines(raw)
    # Insert cream page background as first child of svg.
    raw = raw.replace(
        'xmlns:svg="http://www.w3.org/2000/svg">',
        'xmlns:svg="http://www.w3.org/2000/svg" style="background:#fffcf7">\n'
        '  <rect id="kiosk-page" x="148" y="259" width="1127" height="454" fill="#fffcf7"/>',
        1,
    )
    raw = raw.replace(
        'width="1550.2733"\n   height="1098.3199"\n   viewBox="0 0 1550.2733 1098.3199"',
        'width="1127"\n   height="454"\n   viewBox="148 259 1127 454"',
        1,
    )

    layer_stack: list[str] = []
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
            out.append(tok)
            continue
        if tok == "</g>":
            if layer_stack:
                layer_stack.pop()
            out.append(tok)
            continue
        top = next((name for name in layer_stack if name), "")
        if tok.startswith("<path") and top in FURN_LAYERS:
            d = re.search(r'\sd="([^"]+)"', tok)
            if d:
                bb = path_bbox(d.group(1))
                if bb:
                    tr = re.search(r'transform="([^"]+)"', tok)
                    matrix = parse_matrix(tr.group(1) if tr else None)
                    x0, y0, x1, y1 = to_page(bb, matrix)
                    if inside_room((x0 + x1) / 2, (y0 + y1) / 2):
                        removed_paths += 1
                        continue
            out.append(tok)
            continue
        if tok.startswith("<text") and top in TEXT_LAYERS:
            tr = re.search(r'transform="matrix\(([^)]+)\)"', tok)
            if tr:
                _a, _b, _c, _d, e, f = [float(x) for x in tr.group(1).split(",")]
                if inside_room(e, f - LAYER_Y, pad=-8):
                    removed_text += 1
                    continue
            out.append(tok)
            continue
        out.append(tok)
    out.append(raw[last:])
    svg = "".join(out)
    svg = svg.replace("</svg>", room_layer() + "\n</svg>", 1)
    OUT_SVG.parent.mkdir(parents=True, exist_ok=True)
    OUT_SVG.write_text(svg, encoding="utf-8")
    write_geometry_ts()
    print(f"wrote {OUT_SVG} ({OUT_SVG.stat().st_size / 1e6:.1f} MB)")
    print(f"removed furniture paths: {removed_paths}")
    print(f"removed labels: {removed_text}")
    print(f"wrote {OUT_TS}")
    from cad_common import rasterize_kiosk_svg

    rasterize_kiosk_svg(OUT_SVG)


if __name__ == "__main__":
    process()
