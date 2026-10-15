"""Assemble engine/film.js from its parts."""
head=open('engine/base_head.js').read(); mech=open('engine/base_mech.js').read()
scenes=open('engine/part_scenes.js').read(); rend=open('engine/part_render.js').read()
rend=rend.replace("const n = String(curScene - 1).padStart(2, '0');","const n = String(curScene - 2).padStart(2, '0');")
open('engine/film.js','w').write("/* Movement film engine: calibre 3235 mechanism, camera, watch exterior, studio set and video harness. */\n(() => {\n'use strict';\n"+head+scenes+"\n"+mech+rend+"\n})();\n")
print('assembled')
