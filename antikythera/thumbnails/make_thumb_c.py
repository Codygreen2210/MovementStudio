"""Thumbnail C for Test & Compare: x-ray reveal, '30 GEARS / INSIDE'."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
SRC = '/home/claude/movementstudio/antikythera/fetch/out/thumb_bg_xray.png'
FONT = '/home/claude/video/fonts/HankenGrotesk.ttf'
W, H = 1280, 720
bg = Image.open(SRC).convert('RGB').resize((1190, 669), Image.LANCZOS)
# nudge the object slightly right so the text has room, lift exposure on the glow a touch
canvas = Image.new('RGB', (W, H), bg.getpixel((40, 360)))
mask = Image.new('L', bg.size, 0); ImageDraw.Draw(mask).rectangle((60, 60, bg.size[0] - 60, bg.size[1] - 60), fill=255)
canvas.paste(bg, (W - 1190 + 40, 26), mask.filter(ImageFilter.GaussianBlur(40)))
img = canvas.convert('RGBA')

def font(size, wght=850):
    f = ImageFont.truetype(FONT, size)
    try: f.set_variation_by_axes([wght])
    except Exception: pass
    return f

def text_with_shadow(layer, xy, s, f, fill, stroke=10):
    sh = Image.new('RGBA', layer.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((xy[0] + 6, xy[1] + 8), s, font=f, fill=(0, 0, 0, 200), stroke_width=stroke, stroke_fill=(0, 0, 0, 200))
    layer.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
    ImageDraw.Draw(layer).text(xy, s, font=f, fill=fill, stroke_width=stroke, stroke_fill=(5, 10, 20, 255))

f1 = font(150); f2 = font(108)
text_with_shadow(img, (52, 200), '30 GEARS', f1, (255, 255, 255, 255))
# cyan glow behind INSIDE
glow = Image.new('RGBA', img.size, (0, 0, 0, 0))
ImageDraw.Draw(glow).text((58, 382), 'INSIDE', font=f2, fill=(120, 220, 255, 255))
img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(18)))
text_with_shadow(img, (58, 382), 'INSIDE', f2, (150, 228, 255, 255), stroke=8)
img.convert('RGB').save('/home/claude/anti/thumb/thumb_C.jpg', quality=93)
print('ok')
