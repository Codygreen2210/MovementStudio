"""Localized versions of thumbnail A ('100 BC' in gilt) for Spanish and Hindi."""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
BG = '/home/claude/movementstudio/antikythera/fetch/out/thumb_bg2.png'
W, H = 1280, 720
FONTS = {'es': '/home/claude/video/fonts/HankenGrotesk.ttf',
         'hi': '/home/claude/movementstudio/antikythera/fetch/out/NotoSansDevanagari.ttf'}
TEXT = {'es': '100 a. C.', 'hi': '100 ई.पू.'}

def font(path, size, wght=850):
    f = ImageFont.truetype(path, size)
    try:
        axes = f.get_variation_axes()
        f.set_variation_by_axes([wght if a.get('name', b'') in (b'Weight', 'Weight') else a['default'] for a in axes])
    except Exception:
        try: f.set_variation_by_axes([wght])
        except Exception: pass
    return f

def make(lang):
    img = Image.open(BG).convert('RGB').resize((W, H), Image.LANCZOS).convert('RGBA')
    f = font(FONTS[lang], 168 if lang == 'es' else 176)
    txt = TEXT[lang]
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = d.textbbox((0, 0), txt, font=f, stroke_width=12)
    tw = x1 - x0
    if tw > 600:  # keep clear of the fragment on the right
        f = font(FONTS[lang], int((168 if lang == 'es' else 176) * 600 / tw)); x0, y0, x1, y1 = d.textbbox((0, 0), txt, font=f, stroke_width=12)
    x, y = 60 - x0, (H - (y1 - y0)) // 2 - y0 - 12
    # shadow
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((x + 8, y + 12), txt, font=f, fill=(0, 0, 0, 220), stroke_width=12, stroke_fill=(0, 0, 0, 220))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))
    # dark stroke
    ImageDraw.Draw(img).text((x, y), txt, font=f, fill=(20, 14, 6, 255), stroke_width=12, stroke_fill=(14, 10, 4, 255))
    # gilt gradient fill through a text mask
    mask = Image.new('L', img.size, 0); ImageDraw.Draw(mask).text((x, y), txt, font=f, fill=255)
    grad = Image.new('RGBA', img.size)
    gd = ImageDraw.Draw(grad)
    top, bot = y + y0, y + y1
    for yy in range(H):
        t = min(1, max(0, (yy - top) / max(1, bot - top)))
        c = tuple(int(a + (b - a) * t) for a, b in zip((255, 236, 190), (198, 140, 60)))
        gd.line([(0, yy), (W, yy)], fill=c + (255,))
    img.paste(grad, (0, 0), mask)
    out = f'/home/claude/anti/thumb/thumb_A_{lang}.jpg'
    img.convert('RGB').save(out, quality=93); print(out)

for lang in sys.argv[1:]: make(lang)
