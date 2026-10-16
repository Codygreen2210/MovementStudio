#!/bin/sh
# usage: sheet.sh name t1 t2 ... (multiple of 3)
n=$1; shift
timeout 500 python3 /home/claude/anti/render.py stills "$@" 2>&1 | grep -i "error" | head -3
cd /home/claude/anti/stills; ins=""; f=""; i=0
for t in "$@"; do ins="$ins -i $t.jpg"; f="$f[$i]scale=960:-2[s$i];"; i=$((i+1)); done
rows=$((i/3)); r=""; for k in $(seq 0 $((rows-1))); do a=$((k*3)); f="$f[s$a][s$((a+1))][s$((a+2))]hstack=3[r$k];"; r="$r[r$k]"; done
if [ $rows -eq 1 ]; then f2="${f}"; f2=$(echo "$f2" | sed "s/\[r0\];$//"); ffmpeg -loglevel error -y $ins -filter_complex "$f2" /tmp/claude-0/-home-claude/f3c14648-a629-5b19-883d-130acaf220c5/scratchpad/$n.jpg; exit; fi; ffmpeg -loglevel error -y $ins -filter_complex "${f}${r}vstack=$rows" /tmp/claude-0/-home-claude/f3c14648-a629-5b19-883d-130acaf220c5/scratchpad/$n.jpg
