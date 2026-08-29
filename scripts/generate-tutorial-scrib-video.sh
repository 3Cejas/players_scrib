#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd -- "${script_dir}/.." && pwd)"
output_path="${repo_dir}/game/media/tutorial-scrib.mp4"
vtt_path="${repo_dir}/game/media/tutorial-scrib.vtt"
tts_cache="${SCRIB_TTS_CACHE_DIR:-/tmp/scrib-tutorial-tts-cache}"
keep_build="${SCRIB_KEEP_TUTORIAL_BUILD:-0}"

for command_name in node ffmpeg ffprobe curl; do
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Falta la herramienta requerida: ${command_name}" >&2
    exit 1
  fi
done

if [[ -n "${SCRIB_TUTORIAL_BUILD_DIR:-}" ]]; then
  build_dir="${SCRIB_TUTORIAL_BUILD_DIR}"
  mkdir -p "${build_dir}"
else
  build_dir="$(mktemp -d /tmp/scrib-tutorial-video.XXXXXX)"
fi

cleanup() {
  if [[ "${keep_build}" != "1" && -z "${SCRIB_TUTORIAL_BUILD_DIR:-}" ]]; then
    rm -rf -- "${build_dir}"
  else
    echo "Build conservado en ${build_dir}"
  fi
}
trap cleanup EXIT

mkdir -p "${tts_cache}/site" "${build_dir}/audio/raw" "${build_dir}/audio/slots" "${build_dir}/video"

edge_tts_version="7.2.8"
edge_tts_voice="es-MX-DaliaNeural"
if [[ ! -f "${tts_cache}/pip.pyz" ]]; then
  curl -fsSL --retry 3 -o "${tts_cache}/pip.pyz" https://bootstrap.pypa.io/pip/pip.pyz
fi
installed_edge_tts_version="$(PYTHONPATH="${tts_cache}/site" python3 -c 'import importlib.metadata; print(importlib.metadata.version("edge-tts"))' 2>/dev/null || true)"
if [[ "${installed_edge_tts_version}" != "${edge_tts_version}" ]]; then
  python3 "${tts_cache}/pip.pyz" install --disable-pip-version-check --upgrade \
    --target "${tts_cache}/site" "edge-tts==${edge_tts_version}"
fi

node "${script_dir}/render-tutorial-scrib-scenes.js" "${build_dir}" "${vtt_path}" >/dev/null

manifest_path="${build_dir}/manifest.json"
manifest_tsv="${build_dir}/manifest.tsv"
total_duration="$(node -e 'const scenes=require(process.argv[1]); const last=scenes.at(-1); process.stdout.write(String(last.start + last.duration));' "${manifest_path}")"
music_fade_start="$(awk -v total="${total_duration}" 'BEGIN { printf "%.3f", total - 3 }')"
node - "${manifest_path}" >"${manifest_tsv}" <<'NODE'
const fs = require("fs");
const manifest = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
for (const scene of manifest) {
  process.stdout.write([
    scene.key,
    scene.start,
    scene.duration,
    scene.leadMs,
    scene.image,
    scene.narrationPath,
    scene.voiceRate || "-2%",
    scene.voicePitch || "+2Hz"
  ].join("\t") + "\n");
}
NODE

audio_concat="${build_dir}/audio/slots.txt"
: >"${audio_concat}"
transition_duration="0.32"
video_inputs=()
scene_starts=()

while IFS=$'\t' read -r -u 3 scene_key scene_start scene_duration lead_ms image_path narration_path voice_rate voice_pitch; do
  raw_audio="${build_dir}/audio/raw/${scene_key}.mp3"
  slot_wav="${build_dir}/audio/slots/${scene_key}.wav"
  clip_path="${build_dir}/video/${scene_key}.mp4"

  generated_voice="no"
  for voice_attempt in 1 2 3; do
    if PYTHONPATH="${tts_cache}/site" python3 -m edge_tts \
      --voice "${edge_tts_voice}" \
      --rate="${voice_rate}" \
      --pitch="${voice_pitch}" \
      --file "${narration_path}" \
      --write-media "${raw_audio}"; then
      generated_voice="yes"
      break
    fi
  done
  if [[ "${generated_voice}" != "yes" || ! -s "${raw_audio}" ]]; then
    echo "No se pudo generar la locución neuronal de ${scene_key}." >&2
    exit 1
  fi

  raw_duration="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "${raw_audio}")"
  available_duration="$(awk -v slot="${scene_duration}" -v lead="${lead_ms}" 'BEGIN { printf "%.6f", slot - (lead / 1000) - 0.28 }')"
  tempo_too_high="$(awk -v raw="${raw_duration}" -v available="${available_duration}" 'BEGIN { print (raw / available > 1.15) ? "yes" : "no" }')"
  if [[ "${tempo_too_high}" == "yes" ]]; then
    echo "La locución de ${scene_key} requiere demasiada aceleración (${raw_duration}s en ${available_duration}s)." >&2
    exit 1
  fi
  tempo="$(awk -v raw="${raw_duration}" -v available="${available_duration}" 'BEGIN { if (raw > available) printf "%.6f", raw / available; else print "1.0" }')"

  ffmpeg -nostdin -hide_banner -loglevel error -y -i "${raw_audio}" \
    -af "atempo=${tempo},adelay=${lead_ms},apad=pad_dur=${total_duration},atrim=start=0:end=${scene_duration},asetpts=N/SR/TB" \
    -ar 48000 -ac 1 -c:a pcm_s16le "${slot_wav}"
  printf "file '%s'\n" "${slot_wav}" >>"${audio_concat}"

  clip_duration="$(awk -v slot="${scene_duration}" -v transition="${transition_duration}" 'BEGIN { printf "%.6f", slot + transition }')"
  frame_count="$(awk -v duration="${clip_duration}" 'BEGIN { printf "%d", (duration * 30) + 0.5 }')"
  ffmpeg -nostdin -hide_banner -loglevel error -y -loop 1 -i "${image_path}" \
    -vf "scale=1920:1080:flags=lanczos,fps=30,format=yuv420p" \
    -frames:v "${frame_count}" -an -c:v libx264 -preset ultrafast -crf 12 -g 60 -keyint_min 60 -sc_threshold 0 "${clip_path}"
  video_inputs+=("${clip_path}")
  scene_starts+=("${scene_start}")
done 3<"${manifest_tsv}"

narration_wav="${build_dir}/audio/narration.wav"
mixed_wav="${build_dir}/audio/mixed.wav"
visual_mp4="${build_dir}/video/visual.mp4"

ffmpeg -nostdin -hide_banner -loglevel error -y -f concat -safe 0 -i "${audio_concat}" -ar 48000 -ac 1 -c:a pcm_s16le "${narration_wav}"

video_command=(ffmpeg -nostdin -hide_banner -loglevel error -y)
for clip_path in "${video_inputs[@]}"; do
  video_command+=(-i "${clip_path}")
done
video_filter=""
previous_stream="[0:v]"
for ((scene_index = 1; scene_index < ${#video_inputs[@]}; scene_index += 1)); do
  output_stream="[xfade${scene_index}]"
  video_filter+="${previous_stream}[${scene_index}:v]xfade=transition=fade:duration=${transition_duration}:offset=${scene_starts[scene_index]}${output_stream};"
  previous_stream="${output_stream}"
done
video_filter+="${previous_stream}trim=start=0:end=${total_duration},setpts=PTS-STARTPTS[visual]"
"${video_command[@]}" -filter_complex "${video_filter}" -map "[visual]" \
  -an -c:v libx264 -preset ultrafast -crf 14 -pix_fmt yuv420p -r 30 -g 60 "${visual_mp4}"

ffmpeg -nostdin -hide_banner -loglevel error -y \
  -i "${narration_wav}" \
  -f lavfi -i "sine=frequency=392:sample_rate=48000:duration=0.24" \
  -f lavfi -i "sine=frequency=523.25:sample_rate=48000:duration=0.24" \
  -f lavfi -i "sine=frequency=659.25:sample_rate=48000:duration=0.24" \
  -f lavfi -i "sine=frequency=783.99:sample_rate=48000:duration=0.28" \
  -f lavfi -i "sine=frequency=659.25:sample_rate=48000:duration=0.55" \
  -stream_loop -1 -i "${repo_dir}/game/audio/2. ACOMPAÑAR VOZ CON MELODIA.mp3" \
  -filter_complex \
    "[0:a]volume=1.0,asplit=2[voice][voice_sidechain];\
     [1:a]afade=t=out:st=0:d=0.24,volume=0.075,adelay=79000[c1];\
     [2:a]afade=t=out:st=0:d=0.24,volume=0.075,adelay=85000[c2];\
     [3:a]afade=t=out:st=0:d=0.24,volume=0.075,adelay=91000[c3];\
     [4:a]afade=t=out:st=0:d=0.28,volume=0.075,adelay=97000[c4];\
     [5:a]afade=t=out:st=0:d=0.55,volume=0.06,adelay=103000[ok];\
     [6:a]volume=0.16,afade=t=in:st=0:d=1.2,afade=t=out:st=${music_fade_start}:d=3,atrim=start=0:end=${total_duration}[music];\
     [music][voice_sidechain]sidechaincompress=threshold=0.025:ratio=8:attack=18:release=420[music_ducked];\
     [voice][music_ducked][c1][c2][c3][c4][ok]amix=inputs=7:duration=longest:normalize=0,\
     loudnorm=I=-16:TP=-1.5:LRA=7,atrim=start=0:end=${total_duration},apad=pad_dur=${total_duration}[a]" \
  -map "[a]" -ar 48000 -ac 2 -c:a pcm_s16le "${mixed_wav}"

subtitle_filter="ass=${build_dir}/captions.ass:fontsdir=${repo_dir}/game/css/fonts"
ffmpeg -nostdin -hide_banner -loglevel error -y \
  -i "${visual_mp4}" -i "${mixed_wav}" \
  -filter:v "${subtitle_filter}" \
  -map 0:v:0 -map 1:a:0 -t "${total_duration}" \
  -c:v libx264 -preset medium -crf 23 -profile:v high -level 4.1 -pix_fmt yuv420p -r 30 -g 60 \
  -c:a aac -b:a 112k -ar 48000 -ac 2 \
  -metadata title="SCRIB · Acceso y verificación de musa" \
  -metadata:s:a:0 language=spa \
  -movflags +faststart "${output_path}"

duration="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "${output_path}")"
duration_ok="$(awk -v value="${duration}" -v expected="${total_duration}" 'BEGIN { print (value >= expected - 0.01 && value <= expected + 0.01) ? "yes" : "no" }')"
if [[ "${duration_ok}" != "yes" ]]; then
  echo "Duración inesperada: ${duration} s" >&2
  exit 1
fi

video_info="$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,pix_fmt,r_frame_rate -of csv=p=0 "${output_path}")"
audio_info="$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels -of csv=p=0 "${output_path}")"
if [[ "${video_info}" != h264,1920,1080,yuv420p,30/1 ]]; then
  echo "Pista de vídeo inesperada: ${video_info}" >&2
  exit 1
fi
if [[ "${audio_info}" != aac,48000,2 ]]; then
  echo "Pista de audio inesperada: ${audio_info}" >&2
  exit 1
fi

size_bytes="$(stat -c '%s' "${output_path}")"
if (( size_bytes > 12582912 )); then
  echo "El vídeo supera el objetivo ligero de 12 MiB: ${size_bytes} bytes" >&2
  exit 1
fi

printf 'Generado: %s\nDuración: %s s\nVídeo: %s\nAudio: %s\nTamaño: %s bytes\n' \
  "${output_path}" "${duration}" "${video_info}" "${audio_info}" "${size_bytes}"
