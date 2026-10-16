"""Build tl.json: narration-locked timeline for the Antikythera film (1920x1080, 30 fps)."""
import json
A = '/home/claude/anti'
FPS = 30
# (scene id, lead before narration, hold after narration)
PLAN = [('hook', 1.3, 0.5), ('title', 0, 4.2), ('wreck', 0.9, 0.9), ('xray', 1.0, 1.2), ('crank', 1.6, 3.4),
        ('pinslot', 1.1, 2.2), ('back', 1.8, 3.2), ('planets', 1.0, 2.6), ('who', 1.0, 2.0), ('bridge', 0.8, 0.6), ('end', 0, 16.0)]

def main():
    narr = {s['id']: s['lines'][0] for s in json.load(open(f'{A}/narr.json'))['scenes']}
    t = 0.0; scenes = []; clips = []; cues = []; words = []
    for sid, lead, hold in PLAN:
        S = {'id': sid, 'start': round(t, 3), 'marks': {}}
        t += lead
        if sid in narr:
            L = narr[sid]
            S['voice'] = round(t, 3); S['vdur'] = L['dur']
            clips.append([round(t, 3), f'narr/{L["file"]}'])
            S['marks'] = {k: (round(t + v, 3) if v is not None else None) for k, v in L['marks'].items()}
            cues += [{'s': round(t + c['s'], 3), 'e': round(t + c['e'], 3), 'text': c['text']} for c in L['cues']]
            words += [{'t': w['t'], 's': round(t + w['s'], 3), 'e': round(t + w['e'], 3)} for w in L['words']]
            t += L['dur']
        t += hold
        S['end'] = round(t, 3)
        scenes.append(S)
    total = round(t, 3)
    tl = {'fps': FPS, 'w': 1920, 'h': 1080, 'scenes': scenes, 'total': total, 'frames': int(total * FPS), 'clips': clips, 'cues': cues, 'words': words}
    json.dump(tl, open(f'{A}/tl.json', 'w'), indent=1, ensure_ascii=False)
    print(f'total {total:.1f}s = {int(total//60)}:{total%60:04.1f}, {tl["frames"]} frames')
    for S in scenes: print(f"  {S['start']:7.2f}-{S['end']:7.2f}  {S['id']}")

if __name__ == '__main__':
    main()
