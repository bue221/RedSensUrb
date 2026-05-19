#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/media"
WORK_DIR="$OUT_DIR/.video-work"
OUT_FILE="$OUT_DIR/redsensurb-hypermotion.mp4"

rm -rf "$WORK_DIR"
mkdir -p "$OUT_DIR" "$WORK_DIR"

FONT_REG="/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD="/System/Library/Fonts/Supplemental/Arial Bold.ttf"

cat > "$WORK_DIR/voiceover.txt" <<'TEXT'
Red-SensUrb es un MVP distribuido para monitorear sensores urbanos.
Tres nodos Java simulan telemetría ambiental y envían temperatura, humedad y CO2 por UDP.
El coordinator, construido con Spring Boot, recibe los datos, los persiste en SQLite y expone servicios REST para consultar telemetría y estado de nodos.
Cuando llega una alerta crítica, el sistema usa un flujo distribuido: el cliente llama el endpoint protegido, el coordinator crea una transacción y coordina dos réplicas por RMI.
Primero pregunta prepare. Si ambas réplicas votan sí, confirma con commit. Si alguna falla, ejecuta rollback.
La interfaz React muestra la operación mínima: nodos activos, muestras recientes y evidencia para la defensa del MVP.
En una frase: UDP para alto flujo de sensores, REST para consulta, RMI y dos fases para consistencia crítica, y SQLite para auditoría reproducible.
TEXT

cat > "$WORK_DIR/title.txt" <<'TEXT'
Red-SensUrb
TEXT
cat > "$WORK_DIR/subtitle.txt" <<'TEXT'
Sensores urbanos distribuidos en tiempo real
TEXT
cat > "$WORK_DIR/sensors.txt" <<'TEXT'
3 sensores Java generan telemetría
TEXT
cat > "$WORK_DIR/udp.txt" <<'TEXT'
UDP: flujo ligero hacia el coordinator
TEXT
cat > "$WORK_DIR/coordinator.txt" <<'TEXT'
Coordinator Spring Boot
TEXT
cat > "$WORK_DIR/rest.txt" <<'TEXT'
REST expone telemetry, nodes/status y alerts
TEXT
cat > "$WORK_DIR/sqlite.txt" <<'TEXT'
SQLite guarda histórico y auditoría
TEXT
cat > "$WORK_DIR/critical.txt" <<'TEXT'
Alerta crítica distribuida
TEXT
cat > "$WORK_DIR/twopc.txt" <<'TEXT'
2PC por RMI: prepare -> commit / rollback
TEXT
cat > "$WORK_DIR/frontend.txt" <<'TEXT'
React muestra nodos activos y muestras recientes
TEXT
cat > "$WORK_DIR/close.txt" <<'TEXT'
UDP + REST + RMI + SQLite
TEXT
cat > "$WORK_DIR/close2.txt" <<'TEXT'
Un MVP defendible, observable y reproducible
TEXT

base_slide_args=(
  -size 1920x1080 canvas:"#07151f"
  -fill "#39d98a" -draw "rectangle -120,86 500,98"
  -fill "#ffb020" -draw "rectangle 1420,952 2040,964"
  -fill "#5cc8ff" -draw "rectangle 1180,180 1600,188"
  -fill "#f25f5c" -draw "rectangle 220,880 600,888"
)

magick "${base_slide_args[@]}" \
  -font "$FONT_BOLD" -fill "#ffffff" -pointsize 116 -gravity center -annotate +0-80 "Red-SensUrb" \
  -font "$FONT_REG" -fill "#9ae6b4" -pointsize 46 -annotate +0+20 "Sensores urbanos distribuidos en tiempo real" \
  -fill "#d7eef8" -pointsize 34 -annotate +0+125 "MVP Java + React para monitoreo ambiental" \
  "$WORK_DIR/slide-01.png"

magick "${base_slide_args[@]}" \
  -font "$FONT_BOLD" -fill "#ffffff" -pointsize 60 -gravity north -annotate +0+132 "Ingesta de telemetría" \
  -fill "#123548" -draw "roundrectangle 170,315 490,460 18,18" -draw "roundrectangle 170,505 490,650 18,18" -draw "roundrectangle 170,695 490,840 18,18" \
  -font "$FONT_BOLD" -fill "#ffffff" -pointsize 42 -gravity northwest -annotate +235+363 "sensor-1" -annotate +235+553 "sensor-2" -annotate +235+743 "sensor-3" \
  -stroke "#39d98a" -strokewidth 12 -draw "line 540,387 910,520" -draw "line 540,577 910,560" -draw "line 540,767 910,600" +stroke \
  -fill "#0e2b3c" -draw "roundrectangle 930,390 1490,650 22,22" \
  -font "$FONT_BOLD" -fill "#ffffff" -pointsize 52 -gravity northwest -annotate +1050+470 "Coordinator" \
  -font "$FONT_REG" -fill "#9ae6b4" -pointsize 38 -annotate +1040+540 "UDP ligero y rapido" \
  "$WORK_DIR/slide-02.png"

magick "${base_slide_args[@]}" \
  -font "$FONT_BOLD" -fill "#ffffff" -pointsize 60 -gravity north -annotate +0+130 "Coordinator Spring Boot" \
  -fill "#0e2b3c" -draw "roundrectangle 190,330 660,600 22,22" \
  -fill "#123548" -draw "roundrectangle 725,330 1195,600 22,22" \
  -fill "#3a2b12" -draw "roundrectangle 1260,330 1730,600 22,22" \
  -font "$FONT_BOLD" -fill "#ffffff" -pointsize 46 -gravity northwest -annotate +310+405 "REST API" -annotate +875+405 "SQLite" \
  -fill "#ffcf70" -annotate +1370+405 "Evidencia" \
  -font "$FONT_REG" -fill "#d7eef8" -pointsize 33 -annotate +265+485 "telemetry / nodes / alerts" -annotate +825+485 "historico y auditoria" \
  -fill "#ffffff" -annotate +1340+485 "defensa reproducible" \
  "$WORK_DIR/slide-03.png"

magick "${base_slide_args[@]}" \
  -font "$FONT_BOLD" -fill "#ffffff" -pointsize 64 -gravity north -annotate +0+125 "Alerta critica distribuida" \
  -font "$FONT_REG" -fill "#ffcf70" -pointsize 40 -annotate +0+205 "2PC por RMI: prepare -> commit / rollback" \
  -fill "#123548" -draw "roundrectangle 190,470 540,620 20,20" -draw "roundrectangle 1380,365 1730,505 20,20" -draw "roundrectangle 1380,635 1730,775 20,20" \
  -fill "#0e2b3c" -draw "roundrectangle 785,470 1135,620 20,20" \
  -stroke "#ffb020" -strokewidth 12 -draw "line 570,545 755,545" +stroke \
  -stroke "#39d98a" -strokewidth 12 -draw "line 1165,540 1350,435" -draw "line 1165,575 1350,705" +stroke \
  -font "$FONT_BOLD" -fill "#ffffff" -pointsize 45 -gravity northwest -annotate +285+520 "Cliente" -annotate +845+520 "Coordinator" \
  -pointsize 42 -annotate +1465+410 "replica-a" -annotate +1465+680 "replica-b" \
  -font "$FONT_REG" -fill "#ffcf70" -pointsize 30 -annotate +585+500 "POST protegido" \
  -fill "#9ae6b4" -annotate +1215+388 "prepare" -annotate +1190+725 "commit/rollback" \
  "$WORK_DIR/slide-04.png"

magick "${base_slide_args[@]}" \
  -font "$FONT_BOLD" -fill "#ffffff" -pointsize 60 -gravity north -annotate +0+135 "Web client React" \
  -fill "#0e2b3c" -draw "roundrectangle 220,280 1700,870 26,26" \
  -fill "#123548" -draw "roundrectangle 310,385 670,715 22,22" -draw "roundrectangle 780,385 1140,715 22,22" -draw "roundrectangle 1250,385 1610,715 22,22" \
  -font "$FONT_BOLD" -pointsize 54 -gravity northwest -fill "#9ae6b4" -annotate +410+525 "nodos" \
  -fill "#5cc8ff" -annotate +835+525 "muestras" \
  -fill "#ffcf70" -annotate +1345+525 "alertas" \
  -font "$FONT_REG" -fill "#d7eef8" -pointsize 38 -gravity south -annotate +0+240 "observabilidad minima para defender el MVP" \
  "$WORK_DIR/slide-05.png"

magick "${base_slide_args[@]}" \
  -font "$FONT_BOLD" -fill "#ffffff" -pointsize 80 -gravity center -annotate +0-145 "UDP + REST + RMI + SQLite" \
  -font "$FONT_REG" -fill "#9ae6b4" -pointsize 44 -annotate +0-35 "alto flujo, consulta, consistencia critica y auditoria" \
  -fill "#123548" -draw "roundrectangle 390,560 1530,660 50,50" \
  -font "$FONT_BOLD" -fill "#ffffff" -pointsize 38 -gravity northwest -annotate +575+600 "Un MVP defendible, observable y reproducible" \
  "$WORK_DIR/slide-06.png"

if command -v say >/dev/null 2>&1; then
  say -v Paulina -r 182 -f "$WORK_DIR/voiceover.txt" -o "$WORK_DIR/voiceover.aiff"
  AUDIO_INPUT=(-i "$WORK_DIR/voiceover.aiff")
  AUDIO_MAP=(-map 0:v -map 1:a -shortest)
else
  AUDIO_INPUT=(-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100)
  AUDIO_MAP=(-map 0:v -map 1:a -t 52)
fi

ffmpeg -y \
  -loop 1 -t 7 -i "$WORK_DIR/slide-01.png" \
  -loop 1 -t 9 -i "$WORK_DIR/slide-02.png" \
  -loop 1 -t 9 -i "$WORK_DIR/slide-03.png" \
  -loop 1 -t 12 -i "$WORK_DIR/slide-04.png" \
  -loop 1 -t 7 -i "$WORK_DIR/slide-05.png" \
  -loop 1 -t 8 -i "$WORK_DIR/slide-06.png" \
  "${AUDIO_INPUT[@]}" \
  -filter_complex "
    [0:v]zoompan=z='min(zoom+0.0008,1.05)':d=210:s=1920x1080:fps=30,fade=t=in:st=0:d=0.35,fade=t=out:st=6.65:d=0.35,setpts=PTS-STARTPTS[v0];
    [1:v]zoompan=z='min(zoom+0.0006,1.05)':d=270:s=1920x1080:fps=30,fade=t=in:st=0:d=0.35,fade=t=out:st=8.65:d=0.35,setpts=PTS-STARTPTS[v1];
    [2:v]zoompan=z='min(zoom+0.0006,1.05)':d=270:s=1920x1080:fps=30,fade=t=in:st=0:d=0.35,fade=t=out:st=8.65:d=0.35,setpts=PTS-STARTPTS[v2];
    [3:v]zoompan=z='min(zoom+0.0005,1.06)':d=360:s=1920x1080:fps=30,fade=t=in:st=0:d=0.35,fade=t=out:st=11.65:d=0.35,setpts=PTS-STARTPTS[v3];
    [4:v]zoompan=z='min(zoom+0.0008,1.05)':d=210:s=1920x1080:fps=30,fade=t=in:st=0:d=0.35,fade=t=out:st=6.65:d=0.35,setpts=PTS-STARTPTS[v4];
    [5:v]zoompan=z='min(zoom+0.0007,1.05)':d=240:s=1920x1080:fps=30,fade=t=in:st=0:d=0.35,fade=t=out:st=7.65:d=0.35,setpts=PTS-STARTPTS[v5];
    [v0][v1][v2][v3][v4][v5]concat=n=6:v=1:a=0,format=yuv420p[v]" \
  -map "[v]" \
  -map 6:a \
  -shortest \
  -c:v libx264 -preset medium -crf 20 \
  -c:a aac -b:a 160k \
  -movflags +faststart \
  "$OUT_FILE"

ffprobe -v error -show_entries format=duration,size -show_streams "$OUT_FILE"
rm -rf "$WORK_DIR"
