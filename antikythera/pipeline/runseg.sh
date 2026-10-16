#!/bin/sh
cd /home/claude/anti
python3 render.py segment $1 $2 /home/claude/anti/seg/$3.mp4 > /home/claude/anti/seg/$3.log 2>&1
python3 render.py segment $4 $5 /home/claude/anti/seg/$6.mp4 > /home/claude/anti/seg/$6.log 2>&1
