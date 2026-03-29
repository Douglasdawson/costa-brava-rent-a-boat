#!/usr/bin/env python3
"""
Generate smooth maritime routes from Blanes port along Costa Brava.
Uses OSM coastline data, simplifies it, then offsets offshore.
"""
import json, math, subprocess, sys

BLANES_PORT = (41.6742, 2.7930)
SA_PALOMERA = (41.6706, 2.7918)
CALA_SANT_FRANCESC = (41.6795, 2.8061)
LLORET_BEACH = (41.6983, 2.8482)
TOSSA_PLATJA = (41.7187, 2.9333)

def dist(a, b):
    dlat = (b[0]-a[0])*111320
    dlng = (b[1]-a[1])*111320*math.cos(math.radians(a[0]))
    return math.sqrt(dlat**2 + dlng**2)

def fetch_all_coastline():
    """Fetch all coastline ways and merge into point cloud sorted by longitude"""
    query = '[out:json];way["natural"="coastline"](41.66,2.77,41.74,2.96);out geom;'
    r = subprocess.run(['curl','-s','https://overpass-api.de/api/interpreter',
                        '--data-urlencode',f'data={query}'],
                       capture_output=True, text=True, timeout=60)
    data = json.loads(r.stdout)

    # Collect ALL points from ALL ways
    all_pts = set()
    for el in data.get('elements',[]):
        for pt in el.get('geometry',[]):
            all_pts.add((round(pt['lat'],7), round(pt['lon'],7)))

    return list(all_pts)

def build_coastline_path(raw_points, start, end):
    """
    Build an ordered path along the coast from start to end.
    Uses greedy nearest-neighbor on raw coastline points.
    """
    pts = list(raw_points)

    # Find start
    best_d, best_i = float('inf'), 0
    for i, p in enumerate(pts):
        d = dist(p, start)
        if d < best_d:
            best_d = d
            best_i = i

    path = [pts.pop(best_i)]
    target_d = dist(start, end)

    # Greedy walk toward end
    while pts:
        curr = path[-1]
        # Find nearest point that's roughly toward the end
        best_d, best_i = float('inf'), -1
        curr_to_end = dist(curr, end)

        for i, p in enumerate(pts):
            d = dist(curr, p)
            if d > 500:  # Skip far away points
                continue
            p_to_end = dist(p, end)
            # Prefer points that are closer to us AND closer to the end
            if d < best_d and (p_to_end < curr_to_end + 100):
                best_d = d
                best_i = i

        if best_i < 0 or best_d > 500:
            break

        path.append(pts.pop(best_i))

        # Stop if we're close enough to end
        if dist(path[-1], end) < 200:
            break

    return path

def simplify_path(path, min_dist=100):
    """Keep only points that are at least min_dist apart"""
    if len(path) < 2:
        return path
    result = [path[0]]
    for p in path[1:]:
        if dist(result[-1], p) >= min_dist:
            result.append(p)
    if dist(result[-1], path[-1]) > 10:
        result.append(path[-1])
    return result

def offset_seaward(path, offset_m=200):
    """
    Offset path points seaward. For Costa Brava (coast faces SE),
    seaward is perpendicular right when going NE along coast.
    """
    n = len(path)
    result = []
    for i in range(n):
        p0 = path[max(0, i-2)]
        p1 = path[min(n-1, i+2)]

        dlat = (p1[0]-p0[0]) * 111320
        dlng = (p1[1]-p0[1]) * 111320 * math.cos(math.radians(path[i][0]))
        length = math.sqrt(dlat**2 + dlng**2)

        if length < 0.1:
            result.append(path[i])
            continue

        # Right perpendicular (seaward for NE-going coast facing SE)
        rx = dlng / length
        ry = -dlat / length

        off_lat = (ry * offset_m) / 111320
        off_lng = (rx * offset_m) / (111320 * math.cos(math.radians(path[i][0])))

        result.append((path[i][0] + off_lat, path[i][1] + off_lng))
    return result

def smooth(pts, n=5):
    """Moving average smooth"""
    for _ in range(n):
        new = [pts[0]]
        for i in range(1, len(pts)-1):
            new.append(((pts[i-1][0]+pts[i][0]+pts[i+1][0])/3,
                        (pts[i-1][1]+pts[i][1]+pts[i+1][1])/3))
        new.append(pts[-1])
        pts = new
    return pts

def sample_even(pts, n):
    """Sample n evenly-spaced points"""
    if len(pts) <= n:
        return pts
    cum = [0]
    for i in range(1, len(pts)):
        cum.append(cum[-1] + dist(pts[i-1], pts[i]))
    total = cum[-1]
    if total < 1:
        return pts[:n]
    result = [pts[0]]
    for k in range(1, n-1):
        td = k * total / (n-1)
        for i in range(1, len(cum)):
            if cum[i] >= td:
                seg = cum[i] - cum[i-1]
                t = (td - cum[i-1]) / seg if seg > 0 else 0
                result.append((pts[i-1][0]+t*(pts[i][0]-pts[i-1][0]),
                               pts[i-1][1]+t*(pts[i][1]-pts[i-1][1])))
                break
    result.append(pts[-1])
    return result

def fmt(pts):
    return [{"lat": round(p[0],4), "lng": round(p[1],4)} for p in pts]

def main():
    print("Fetching coastline...", file=sys.stderr)
    raw = fetch_all_coastline()
    print(f"Got {len(raw)} unique coastline points", file=sys.stderr)

    # Build ordered coastal paths for each route segment
    routes = {}

    # Sa Palomera - manual (very short, 400m)
    routes['sa-palomera'] = [
        BLANES_PORT,
        (41.6735, 2.7928),
        (41.6725, 2.7924),
        (41.6715, 2.7921),
        (41.6708, 2.7919),
        (41.6702, 2.7917),
    ]
    print("Sa Palomera: manual 6 pts", file=sys.stderr)

    # For longer routes, build coastal path then offset
    for name, dest, n_out, offset in [
        ("cala-sant-francesc", CALA_SANT_FRANCESC, 10, 200),
        ("blanes-lloret", LLORET_BEACH, 18, 250),
        ("blanes-tossa", TOSSA_PLATJA, 25, 300),
    ]:
        print(f"\n--- {name} ---", file=sys.stderr)
        path = build_coastline_path(list(raw), BLANES_PORT, dest)
        print(f"  Raw path: {len(path)} pts", file=sys.stderr)

        if len(path) < 5:
            print(f"  WARNING: Path too short ({len(path)} pts), skipping", file=sys.stderr)
            continue

        simplified = simplify_path(path, 80)
        print(f"  Simplified: {len(simplified)} pts", file=sys.stderr)

        offshore = offset_seaward(simplified, offset)
        smoothed = smooth(offshore, 8)
        sampled = sample_even(smoothed, n_out)
        sampled[0] = BLANES_PORT
        routes[name] = sampled

        print(f"  Final: {len(sampled)} pts", file=sys.stderr)
        print(f"  Start: ({sampled[0][0]:.4f}, {sampled[0][1]:.4f})", file=sys.stderr)
        print(f"  End: ({sampled[-1][0]:.4f}, {sampled[-1][1]:.4f})", file=sys.stderr)

    # Costa Brava Tour - round trip
    if 'blanes-tossa' in routes:
        out = list(routes['blanes-tossa'])
        # Return: same path but 500m further offshore
        path = build_coastline_path(list(raw), TOSSA_PLATJA, BLANES_PORT)
        if len(path) >= 5:
            simplified = simplify_path(path, 150)
            offshore = offset_seaward(simplified, 700)
            smoothed = smooth(offshore, 10)
            ret = sample_even(smoothed, 12)
            ret[-1] = BLANES_PORT
            routes['costa-brava-tour'] = out + ret[1:]
        else:
            # Fallback: reverse outbound shifted further out
            ret_pts = [(p[0]-0.002, p[1]+0.003) for p in reversed(out[1:])]
            ret = sample_even(ret_pts, 10)
            ret[-1] = BLANES_PORT
            routes['costa-brava-tour'] = out + ret
        print(f"\nCosta Brava Tour: {len(routes['costa-brava-tour'])} pts", file=sys.stderr)

    output = {k: fmt(v) for k, v in routes.items()}
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()
