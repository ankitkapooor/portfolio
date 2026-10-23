"""Centre-line stroke tracing for handwriting masks (shared by phrases and glyphs)."""
import numpy as np
from scipy import ndimage as ndi
from skimage.morphology import skeletonize

def body_band(mask):
    """Rows of the main letter body: returns (top, baseline) in mask rows."""
    prof = mask.sum(1).astype(float)
    prof = ndi.uniform_filter1d(prof, 5)
    on = prof >= 0.35 * prof.max()
    best, cur, start = (0, 0), 0, None
    for i, v in enumerate(on):
        if v and start is None: start = i
        if (not v or i == len(on) - 1) and start is not None:
            end = i if not v else i + 1
            if end - start > best[1] - best[0]: best = (start, end)
            start = None
    return best

def trace(mask, smooth=1.2, rdp_eps=1.0):
    m = ndi.gaussian_filter(mask.astype(float), smooth) > 0.5
    m = np.pad(m, 4)
    dist = ndi.distance_transform_edt(m)
    skel = skeletonize(m)
    stroke = float(np.median(dist[skel]) * 2) if skel.any() else 4.0
    pts = set(zip(*np.nonzero(skel)))
    def nbrs(p):
        y, x = p
        return [(y+dy, x+dx) for dy in (-1,0,1) for dx in (-1,0,1) if (dy or dx) and (y+dy, x+dx) in pts]
    deg = {p: len(nbrs(p)) for p in pts}
    nodes = {p for p in pts if deg[p] != 2}
    seen = set(); edges = []
    def key(a, b): return (min(a, b), max(a, b))
    def walk(start, nxt):
        path = [start, nxt]; prev, cur = start, nxt
        while cur not in nodes:
            cand = [q for q in nbrs(cur) if q != prev and key(cur, q) not in seen]
            if not cand: break
            cand.sort(key=lambda q: abs(q[0]-cur[0]) + abs(q[1]-cur[1]))
            seen.add(key(cur, cand[0])); prev, cur = cur, cand[0]; path.append(cur)
            if cur == start: break
        return path
    for n in nodes:
        for q in nbrs(n):
            if key(n, q) in seen: continue
            seen.add(key(n, q)); edges.append(walk(n, q))
    rest = {p for p in pts if p not in nodes and all(key(p, q) not in seen for q in nbrs(p))}
    while rest:
        s = rest.pop(); nb = nbrs(s)
        if not nb: edges.append([s]); continue
        seen.add(key(s, nb[0])); path = walk(s, nb[0]); rest -= set(path); edges.append(path)
    out = []
    for e in edges:
        free = (deg.get(e[0], 0) == 1) + (deg.get(e[-1], 0) == 1)
        if len(e) < stroke * 0.9 and free == 1: continue
        if e[-1][1] < e[0][1]: e = e[::-1]
        out.append([(x - 4, y - 4) for y, x in rdp(e, rdp_eps)])
    # dots: tiny components the skeleton reduced to almost nothing
    lab, n = ndi.label(m)
    for i in range(1, n + 1):
        comp = lab == i
        if comp.sum() < (stroke * 2.5) ** 2 and not any(comp[p] for e in edges for p in e[:1]):
            cy, cx = ndi.center_of_mass(comp); out.append([(cx - 4, cy - 4)])
    out.sort(key=lambda poly: min(p[0] for p in poly))
    return out, stroke

def rdp(points, eps):
    if len(points) < 3: return points
    a, b = np.array(points[0], float), np.array(points[-1], float)
    P = np.array(points, float); ab = b - a; L = np.hypot(*ab)
    d = np.abs(ab[0]*(P[:,1]-a[1]) - ab[1]*(P[:,0]-a[0])) / L if L > 0 else np.hypot(*(P - a).T)
    i = int(np.argmax(d))
    if d[i] > eps: return rdp(points[:i+1], eps)[:-1] + rdp(points[i:], eps)
    return [points[0], points[-1]]

def path_d(poly, s=1.0, dx=0.0, dy=0.0):
    P = [((x + dx) * s, (y + dy) * s) for x, y in poly]
    f = lambda v: str(int(round(v)))
    if len(P) == 1: return f"M{f(P[0][0])} {f(P[0][1])}h1"
    d = f"M{f(P[0][0])} {f(P[0][1])}"
    for i in range(len(P) - 1):
        p0 = P[i-1] if i > 0 else P[i]; p1, p2 = P[i], P[i+1]; p3 = P[i+2] if i + 2 < len(P) else P[i+1]
        c1 = (p1[0] + (p2[0]-p0[0])/6, p1[1] + (p2[1]-p0[1])/6); c2 = (p2[0] - (p3[0]-p1[0])/6, p2[1] - (p3[1]-p1[1])/6)
        d += f"C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}"
    return d

def poly_len(poly):
    return sum(np.hypot(poly[i+1][0]-poly[i][0], poly[i+1][1]-poly[i][1]) for i in range(len(poly)-1)) or 1.0
