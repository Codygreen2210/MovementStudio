#!/bin/sh
# usage: mux2.sh <fmt> "<Title>"
set -e
cd /home/claude/everyday
n=$1; T=$2; M=/home/claude/video/mix_$n.wav
printf "file '/home/claude/everyday/${n}2_a.mp4'\nfile '/home/claude/everyday/${n}2_b.mp4'\n" > ${n}2_list.txt
ffmpeg -loglevel error -y -f concat -safe 0 -i ${n}2_list.txt -c copy ${n}2_noaudio.mp4
J=$(ffmpeg -hide_banner -i $M -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
ii=$(echo "$J" | python3 -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ffmpeg -loglevel error -y -i ${n}2_noaudio.mp4 -i $M -map 0:v -map 1:a -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11:$ii:linear=true,aresample=48000" -ac 2 -c:a aac -b:a 192k -shortest -movflags +faststart "v2_$T.mp4"
ffmpeg -hide_banner -i "v2_$T.mp4" -af ebur128 -f null - 2>&1 | grep -A1 "Integrated" | tail -1
ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "v2_$T.mp4"
python3 /home/claude/video/motioncheck.py "v2_$T.mp4" portrait
