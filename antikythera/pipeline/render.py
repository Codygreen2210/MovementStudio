"""Antikythera film renderer.
  python3 render.py stills t1 t2 ...        -> stills/<t>.jpg (contact checks)
  python3 render.py segment a b out.mp4     -> frames a..b-1 encoded
  python3 render.py sfx                     -> sfx.json (sound events from marks)
"""
import asyncio, base64, json, subprocess, sys, time
from playwright.async_api import async_playwright
A = '/home/claude/anti'
TL = json.load(open(f'{A}/tl.json'))

async def page():
    pw = await async_playwright().start()
    b = await pw.chromium.launch(args=['--allow-file-access-from-files', '--disable-web-security'])
    pg = await b.new_page(viewport={'width': 960, 'height': 540})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    tl = {k: v for k, v in TL.items() if k not in ('clips', 'words')}
    await pg.add_init_script('window.__TL = ' + json.dumps(tl) + ';')
    await pg.goto(f'file://{A}/engine/anti.html')
    info = await pg.evaluate('window.__init()')
    if errs: print('init errors:', errs[:5])
    return pw, b, pg, errs, info

async def stills(ts):
    pw, b, pg, errs, info = await page(); print(info)
    import os; os.makedirs(f'{A}/stills', exist_ok=True)
    for t in ts:
        u = await pg.evaluate(f'window.__advance({int(round(float(t) * 30))}, true)')
        open(f'{A}/stills/{t}.jpg', 'wb').write(base64.b64decode(u.split(',', 1)[1]))
    print('errors:', errs[:8]); await b.close(); await pw.stop()

async def segment(a, z, out):
    pw, b, pg, errs, info = await page()
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-',
                           '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    t0 = time.time()
    for i in range(a, z):
        u = await pg.evaluate(f'window.__advance({i}, true)')
        ff.stdin.write(base64.b64decode(u.split(',', 1)[1]))
        if (i - a) % 300 == 0: print(f'frame {i}/{z}  {time.time()-t0:.0f}s', flush=True)
    ff.stdin.close(); ff.wait()
    print('errors:', errs[:8], 'done', round(time.time() - t0)); await b.close(); await pw.stop()

async def sfx():
    pw, b, pg, errs, info = await page()
    e = await pg.evaluate('window.__sfx()'); json.dump(e, open(f'{A}/sfx.json', 'w')); print(len(e), 'events', errs[:5])
    await b.close(); await pw.stop()

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'stills': asyncio.run(stills(sys.argv[2:]))
    elif cmd == 'segment': asyncio.run(segment(int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]))
    elif cmd == 'sfx': asyncio.run(sfx())
