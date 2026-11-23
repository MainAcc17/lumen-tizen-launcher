"""Procedural scenic wallpaper for Lumen: mountain lake, four lights (dawn, day, sunset, night).
Same landscape in every light; only the light changes. Original artwork, generated here."""
import sys, os
import numpy as np
from PIL import Image, ImageFilter

W, H = 1920, 1080
HORIZON = 800          # lake shoreline
rng = np.random.default_rng(20261117)

def vnoise(n, freq, seed):
    r = np.random.default_rng(seed)
    pts = r.random(int(freq) + 3)
    x = np.linspace(0, freq, n)
    i = np.floor(x).astype(int)
    f = x - i
    f = f * f * (3 - 2 * f)
    return pts[i] * (1 - f) + pts[i + 1] * f

def ridge(base, amp, octaves, seed, sharp=0.0):
    h = np.zeros(W)
    a, fr = 1.0, 3.0
    tot = 0
    for o in range(octaves):
        n = vnoise(W, fr, seed + o * 17)
        if sharp:
            n = 1 - np.abs(n * 2 - 1)        # ridged noise for peaks
            n = n ** (1 + sharp)
        h += a * n
        tot += a
        a *= 0.5
        fr *= 2.1
    h /= tot
    return base - h * amp

# geometry (shared by all lights)
LAYERS = [  # (top line, amplitude, octaves, seed, sharp)
    ridge(560, 300, 6, 11, 0.6),    # far snowy range
    ridge(660, 210, 6, 23, 0.3),    # middle range
    ridge(740, 130, 6, 37, 0.0),    # near forested hills
    ridge(800, 40, 5, 51, 0.0),     # shoreline
]
LAYERS[3] = np.maximum(LAYERS[3], 770)

def tex2d(seed, gw, gh, lo, hi):
    r = np.random.default_rng(seed)
    g = (r.random((gh, gw)) * 255).astype(np.uint8)
    t = np.asarray(Image.fromarray(g).resize((W, H), Image.BICUBIC)).astype(float) / 255
    return lo + (hi - lo) * t
TEXN = tex2d(71, 160, 40, -1, 1)
TEX = [tex2d(61, 48, 30, .92, 1.07) * tex2d(62, 192, 160, .97, 1.03), tex2d(63, 40, 26, .93, 1.05)]

PAL = {
    'day': dict(sky=[(0, (84, 146, 196)), (.42, (150, 190, 212)), (.78, (240, 222, 190)), (1, (255, 226, 178))],
                layers=[(222, 196, 176), (160, 136, 118), (78, 104, 60), (52, 68, 40)],
                haze=(252, 222, 180), snow=(255, 246, 228), sun=(1180, 250, 44, (255, 238, 186), .75),
                water=(104, 140, 140), stars=0, clouds=((255, 240, 216), .72), glow=(255, 232, 190), warm=1.0, sat=1.12),
    'dawn': dict(sky=[(0, (48, 62, 128)), (.5, (176, 128, 170)), (.85, (250, 176, 150)), (1, (255, 214, 170))],
                 layers=[(150, 128, 170), (104, 88, 138), (62, 56, 96), (34, 32, 58)],
                 haze=(240, 180, 170), snow=(255, 222, 220), sun=(560, 600, 70, (255, 214, 160), .9),
                 water=(110, 96, 150), stars=.25, clouds=((255, 200, 200), .55), glow=(255, 200, 160)),
    'sunset': dict(sky=[(0, (34, 34, 96)), (.45, (150, 70, 120)), (.8, (250, 120, 70)), (1, (255, 186, 96))],
                   layers=[(140, 76, 104), (92, 46, 80), (52, 28, 56), (26, 16, 34)],
                   haze=(255, 140, 90), snow=(255, 190, 160), sun=(1360, 600, 80, (255, 170, 90), 1.0),
                   water=(120, 60, 90), stars=.15, clouds=((255, 150, 110), .7), glow=(255, 160, 90)),
    'night': dict(sky=[(0, (6, 10, 30)), (.6, (16, 30, 66)), (1, (34, 58, 100))],
                  layers=[(44, 58, 92), (28, 40, 70), (16, 26, 48), (8, 14, 28)],
                  haze=(60, 86, 130), snow=(150, 170, 210), sun=(1300, 190, 30, (236, 240, 252), .32),
                  water=(20, 34, 64), stars=1, clouds=((60, 74, 110), .35), glow=(200, 215, 255)),
}

def grad(stops, n):
    ys = np.linspace(0, 1, n)
    out = np.zeros((n, 3))
    for c in range(3):
        out[:, c] = np.interp(ys, [s[0] for s in stops], [s[1][c] for s in stops])
    return out

def render(name):
    p = PAL[name]
    img = np.zeros((H, W, 3))
    sky = grad(p['sky'], HORIZON)
    img[:HORIZON] = sky[:, None, :]
    yy, xx = np.mgrid[0:H, 0:W].astype(float)
    # stars
    if p['stars']:
        r = np.random.default_rng(5)
        n = int(900 * p['stars'])
        sx, sy = r.integers(0, W, n), (r.random(n) ** 1.6 * 560).astype(int)
        br = r.random(n) * 180 * p['stars'] + 40
        for x, y, b in zip(sx, sy, br):
            img[y, x] = np.minimum(255, img[y, x] + b)
            if b > 170:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    if 0 <= x + dx < W and 0 <= y + dy < H:
                        img[y + dy, x + dx] = np.minimum(255, img[y + dy, x + dx] + b * .35)
    # sun / moon glow
    cx, cy, rad, col, strength = p['sun']
    d = np.sqrt((xx - cx) ** 2 + ((yy - cy) * 1.15) ** 2)
    glow = np.exp(-(d / (rad * 6.5)) ** 1.2) * strength
    img += (np.array(col) - img) * glow[..., None] * 0.85
    dd = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    disc = np.clip((rad - dd) / 2.5, 0, 1)
    img += (np.array(col) - img) * disc[..., None]
    if name == 'night':      # soft moon surface
        img -= (disc * np.clip(tex2d(91, 24, 24, -1, 1), 0, 1) * 22)[..., None]
    # soft clouds
    if p.get('clouds'):
        cl = tex2d(81, 6, 40, 0, 1) * .55 + tex2d(82, 16, 90, 0, 1) * .3 + tex2d(83, 40, 160, 0, 1) * .15
        band = np.exp(-((yy - 230) / 150) ** 2)
        a = np.clip((cl - .56) * 2.6, 0, 1) * band * p['clouds'][1]
        img += (np.array(p['clouds'][0]) - img) * a[..., None]
    # mountain layers, far to near, with haze at their feet
    for li, top in enumerate(LAYERS):
        col = np.array(p['layers'][li], float)
        mask = yy >= top[None, :]
        k = np.exp(-np.linspace(-3, 3, 121) ** 2); k /= k.sum()
        topS = np.convolve(np.pad(top, 60, mode='edge'), k, mode='valid')
        depth = np.clip((yy - topS[None, :]) / 260.0, 0, 1)
        shade = col * (1.08 - 0.22 * depth[..., None])
        # light from the sun side on ridge slopes
        slope = np.gradient(topS)
        lit = np.clip(-slope * np.sign(cx - xx[0]) * 0.035, -0.10, 0.14)
        shade = shade * (1 + (lit[None, :] * np.exp(-depth * 4))[..., None])
        hz = np.clip((yy - (topS[None, :] + 40)) / 220.0, 0, 1) * (0.55 - li * 0.12)
        shade = shade + (np.array(p['haze']) - shade) * hz[..., None] * (1 if li < 3 else .3)
        if li < 2:
            shade = shade * TEX[li][..., None]
        if li == 0:   # snow caps on the high peaks only
            n = vnoise(W, 45, 99)[None, :] * 22 + TEXN * 14
            depth_snow = np.clip((470 - topS[None, :]) * 0.75, 0, 150)
            sm = (yy < topS[None, :] + depth_snow + n - 6) & mask
            sh = shade[sm]
            shade[sm] = sh * .2 + np.array(p['snow']) * .8 * (0.93 + 0.12 * (lit[None, :].repeat(H, 0)[sm][:, None] / .14))
        if li == 2:   # forest texture
            shade = shade * tex2d(64, 240, 200, .94, 1.05)[..., None]
        img[mask] = shade[mask]
    # trees on the near hills
    r = np.random.default_rng(3)
    tcol = np.array(p['layers'][3], float) * .8
    for _ in range(260):
        x = r.integers(0, W)
        if 560 < x < 1360 and r.random() < .7:
            continue
        base = LAYERS[2][x] + r.integers(10, 60)
        h = r.integers(26, 70)
        w = h * .32
        ys = np.arange(int(base - h), int(base))
        for y in ys:
            if y >= HORIZON or y < 0:
                continue
            half = w * (y - (base - h)) / h
            x0, x1 = int(max(0, x - half)), int(min(W, x + half + 1))
            img[y, x0:x1] = tcol
    # lake: mirrored scene, darker, rippled
    refl = img[HORIZON - 1::-1][: H - HORIZON].copy()
    ripple = (np.sin(np.arange(H - HORIZON)[:, None] * 0.55) * 1.6 + vnoise(W, 8, 4)[None, :] * 1.2).astype(int)
    rows = np.arange(H - HORIZON)[:, None]
    src = np.clip(rows + ripple, 0, H - HORIZON - 1)
    refl = refl[src, np.arange(W)[None, :]]
    water = np.array(p['water'], float)
    fade = np.linspace(.35, .75, H - HORIZON)[:, None, None]
    refl = refl * (1 - fade) + water * fade
    # glints
    rim = Image.fromarray(np.clip(refl, 0, 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(2))
    refl = np.asarray(rim).astype(float)
    lines = (np.sin(rows * 0.8 + vnoise(W, 6, 9)[None, :] * 4) > .93) * np.linspace(.18, .05, H - HORIZON)[:, None]
    refl += (np.array(p['glow']) - refl) * lines[..., None]
    img[HORIZON:] = refl
    # soft shoreline
    img[HORIZON - 2:HORIZON + 2] = img[HORIZON - 2:HORIZON + 2] * .85
    v = 1 - (0.16 if p.get('warm') else 0.22) * np.clip(((xx - W / 2) / (W * .62)) ** 2 + ((yy - H / 2) / (H * .75)) ** 2, 0, 1)   # soft vignette
    img = img * v[..., None] * p.get('warm', 1)
    if p.get('warm'):
        img[..., 0] *= 1.04; img[..., 2] *= 0.93
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    im = im.filter(ImageFilter.GaussianBlur(0.7))
    if p.get('sat'):
        from PIL import ImageEnhance
        im = ImageEnhance.Color(im).enhance(p['sat'])
    return im

if __name__ == '__main__':
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    for name in PAL:
        im = render(name)
        base = os.path.join(out, 'scenic-' + name)
        im.save(base + '.jpg', quality=86, optimize=True, progressive=False)
        im.resize((960, 540), Image.LANCZOS).filter(ImageFilter.GaussianBlur(10)).save(base + '-soft.jpg', quality=82)
        im.resize((480, 270), Image.LANCZOS).filter(ImageFilter.GaussianBlur(9)).save(base + '-frost.jpg', quality=82)
        im.resize((320, 180), Image.LANCZOS).save(base + '-thumb.jpg', quality=82)
        print(name, os.path.getsize(base + '.jpg'))
