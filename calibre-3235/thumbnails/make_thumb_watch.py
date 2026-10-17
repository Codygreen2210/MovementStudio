"""Watch video thumbnail: cutaway steel watch (generated, no branding) + 'NO BATTERY'."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
SRC = '/home/claude/movementstudio/antikythera/fetch/out/watch_thumb_1.png'
FONT = '/home/claude/video/fonts/HankenGrotesk.ttf'
W, H = 1280, 720
bg = Image.open(SRC).convert('RGB').resize((W, H), Image.LANCZOS)
bg = ImageEnhance.Contrast(bg).enhance(1.08)
img = bg.convert('RGBA')
# darken the left third a little more so the words pop
shade = Image.new('L', (W, H), 0); d = ImageDraw.Draw(shade)
for x in range(W):
    a = int(max(0, 150 * (1 - x / 620)))
    d.line([(x, 0), (x, H)], fill=a)
img.alpha_composite(Image.merge('RGBA', [Image.new('L', (W, H), 0)] * 3 + [shade]))

def font(size, wght=880):
    f = ImageFont.truetype(FONT, size)
    try: f.set_variation_by_axes([wght])
    except Exception: pass
    return f

def text(layer, xy, s, f, fill, stroke=9, glow=None):
    if glow:
        g = Image.new('RGBA', layer.size, (0, 0, 0, 0))
        ImageDraw.Draw(g).text(xy, s, font=f, fill=glow)
        layer.alpha_composite(g.filter(ImageFilter.GaussianBlur(22)))
    sh = Image.new('RGBA', layer.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((xy[0] + 6, xy[1] + 9), s, font=f, fill=(0, 0, 0, 210), stroke_width=stroke, stroke_fill=(0, 0, 0, 210))
    layer.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
    ImageDraw.Draw(layer).text(xy, s, font=f, fill=fill, stroke_width=stroke, stroke_fill=(8, 10, 16, 255))

text(img, (50, 178), 'NO', font(178), (255, 255, 255, 255))
text(img, (50, 368), 'BATTERY', font(120), (238, 200, 120, 255), glow=(238, 190, 100, 140))
img.convert('RGB').save('/home/claude/video/YouTube thumbnail (long) v2.jpg', quality=93)
print('ok')
