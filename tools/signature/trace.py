import sys, json, numpy as np
from PIL import Image
from skimage.morphology import skeletonize
from scipy import ndimage as ndi

src, out = sys.argv[1], sys.argv[2]
img = np.asarray(Image.open(src).convert('L')).astype(float)
ink = img > 128
ys, xs = np.nonzero(ink)
pad = 30
y0, y1, x0, x1 = ys.min()-pad, ys.max()+pad, xs.min()-pad, xs.max()+pad
ink = ink[y0:y1, x0:x1]
H, W = ink.shape
dist = ndi.distance_transform_edt(ink)
skel = skeletonize(ink)
stroke = float(np.median(dist[skel]) * 2)

# 8-neighbour graph over skeleton pixels
pts = set(zip(*np.nonzero(skel)))
def nbrs(p):
    y, x = p
    return [(y+dy, x+dx) for dy in (-1,0,1) for dx in (-1,0,1) if (dy or dx) and (y+dy, x+dx) in pts]
deg = {p: len(nbrs(p)) for p in pts}
nodes = {p for p in pts if deg[p] != 2}
visited_edges = set()
edges = []
def walk(start, nxt):
    path = [start, nxt]
    prev, cur = start, nxt
    while cur not in nodes:
        cand = [q for q in nbrs(cur) if q != prev and (min(cur,q), max(cur,q)) not in visited_edges]
        if not cand: break
        # prefer 4-neighbours to avoid cutting corners
        cand.sort(key=lambda q: abs(q[0]-cur[0]) + abs(q[1]-cur[1]))
        visited_edges.add((min(cur, cand[0]), max(cur, cand[0])))
        prev, cur = cur, cand[0]
        path.append(cur)
        if cur == start: break
    return path
for n in nodes:
    for q in nbrs(n):
        key = (min(n,q), max(n,q))
        if key in visited_edges: continue
        visited_edges.add(key)
        edges.append(walk(n, q))
# pure cycles with no nodes
remaining = {p for p in pts if p not in nodes and all((min(p,q),max(p,q)) not in visited_edges for q in nbrs(p))}
while remaining:
    s = remaining.pop()
    q = nbrs(s)[0]
    visited_edges.add((min(s,q),max(s,q)))
    path = walk(s, q)
    remaining -= set(path)
    edges.append(path)

def rdp(points, eps):
    if len(points) < 3: return points
    a, b = np.array(points[0], float), np.array(points[-1], float)
    ab = b - a; L = np.hypot(*ab)
    P = np.array(points, float)
    d = np.abs(np.cross(ab, P - a)) / L if L > 0 else np.hypot(*(P - a).T)
    i = int(np.argmax(d))
    if d[i] > eps:
        return rdp(points[:i+1], eps)[:-1] + rdp(points[i:], eps)
    return [points[0], points[-1]]

def to_path(poly):
    P = [(x, y) for y, x in poly]
    if len(P) == 1:
        x, y = P[0]; return f"M{x:.1f} {y:.1f}h0.1"
    d = f"M{P[0][0]:.1f} {P[0][1]:.1f}"
    # Catmull-Rom -> cubic Bezier
    for i in range(len(P) - 1):
        p0 = P[i-1] if i > 0 else P[i]
        p1, p2 = P[i], P[i+1]
        p3 = P[i+2] if i + 2 < len(P) else P[i+1]
        c1 = (p1[0] + (p2[0]-p0[0])/6, p1[1] + (p2[1]-p0[1])/6)
        c2 = (p2[0] - (p3[0]-p1[0])/6, p2[1] - (p3[1]-p1[1])/6)
        d += f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}"
    return d

paths = []
spur = stroke * 0.9
for e in edges:
    length = len(e)
    ends_free = (deg[e[0]] == 1) + (deg[e[-1]] == 1)
    # Skeleton spurs: short branches hanging off a junction.
    if length < spur and ends_free == 1: continue
    # orient left -> right so each stroke "writes" forward
    if e[-1][1] < e[0][1]: e = e[::-1]
    simp = rdp(e, 1.2)
    paths.append({"d": to_path(simp), "x": int(min(p[1] for p in e)), "len": int(length)})

# isolated dots (components too small to skeletonize into an edge)
lab, n = ndi.label(ink)
covered = set()
for e in edges: covered.update(e)
for i in range(1, n + 1):
    comp = lab == i
    if not any(comp[p] for p in covered) or comp.sum() < stroke * stroke * 2.2:
        cy, cx = ndi.center_of_mass(comp)
        if any(abs(pp["x"] - cx) < 2 and pp["d"].endswith("h0.1") for pp in paths): continue
        paths.append({"d": f"M{cx:.1f} {cy:.1f}h0.1", "x": float(cx), "len": 1})

paths.sort(key=lambda p: p["x"])
json.dump({"w": int(W), "h": int(H), "stroke": round(stroke, 1), "paths": paths}, open(out, "w"))
print("size", W, H, "stroke", round(stroke, 1), "edges", len(edges), "paths", len(paths), "components", n)
