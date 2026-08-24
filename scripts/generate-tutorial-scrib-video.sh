#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd -- "${script_dir}/.." && pwd)"
output_path="${repo_dir}/game/media/tutorial-scrib.mp4"
vtt_path="${repo_dir}/game/media/tutorial-scrib.vtt"
tts_cache="${SCRIB_TTS_CACHE_DIR:-/tmp/scrib-tutorial-tts-cache}"
keep_build="${SCRIB_KEEP_TUTORIAL_BUILD:-0}"

for command_name in node ffmpeg ffprobe curl sha256sum; do
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

mkdir -p "${tts_cache}/site" "${tts_cache}/voice" "${build_dir}/audio/raw" "${build_dir}/audio/slots" "${build_dir}/video"

piper_version="1.7.0"
piper_model="${tts_cache}/voice/es_MX-claude-high.onnx"
piper_config="${piper_model}.json"
piper_model_url="https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_MX/claude/high/es_MX-claude-high.onnx?download=true"
piper_config_url="https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_MX/claude/high/es_MX-claude-high.onnx.json?download=true"
piper_model_sha256="3ef40a71ea63852cd8ab7e6fa7d2ecdcfa67a0b47c9c48e3f10e02ee02083ea0"
piper_config_sha256="1afc81f703c0e4cb3b4d7c0dca096b8b54a98806807f0170cf5eb5557723c12d"

if [[ ! -f "${tts_cache}/site/piper/__main__.py" ]]; then
  if [[ ! -f "${tts_cache}/pip.pyz" ]]; then
    curl -fsSL --retry 3 -o "${tts_cache}/pip.pyz" https://bootstrap.pypa.io/pip/pip.pyz
  fi
  python3 "${tts_cache}/pip.pyz" install --disable-pip-version-check --target "${tts_cache}/site" "piper-tts==${piper_version}"
fi

if [[ ! -f "${piper_model}" ]]; then
  curl -fL --retry 3 -o "${piper_model}" "${piper_model_url}"
fi
if [[ ! -f "${piper_config}" ]]; then
  curl -fL --retry 3 -o "${piper_config}" "${piper_config_url}"
fi
printf '%s  %s\n%s  %s\n' \
  "${piper_model_sha256}" "${piper_model}" \
  "${piper_config_sha256}" "${piper_config}" | sha256sum --check --status

node "${script_dir}/render-tutorial-scrib-scenes.js" "${build_dir}" "${vtt_path}" >/dev/null

manifest_path="${build_dir}/manifest.json"
manifest_tsv="${build_dir}/manifest.tsv"
node - "${manifest_path}" >"${manifest_tsv}" <<'NODE'
const fs = require("fs");
const manifest = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
for (const scene of manifest) {
  process.stdout.write([scene.key, scene.duration, scene.leadMs, scene.image, scene.narration].join("\t") + "\n");
}
NODE

audio_concat="${build_dir}/audio/slots.txt"
video_concat="${build_dir}/video/segments.txt"
: >"${audio_concat}"
: >"${video_concat}"

while IFS=$'\t' read -r -u 3 scene_key scene_duration lead_ms image_path narration_path; do
  raw_wav="${build_dir}/audio/raw/${scene_key}.wav"
  slot_wav="${build_dir}/audio/slots/${scene_key}.wav"
  clip_path="${build_dir}/video/${scene_key}.mp4"

  PYTHONPATH="${tts_cache}/site" python3 -m piper \
    --model "${piper_model}" \
    --config "${piper_config}" \
    --input-file "${narration_path}" \
    --output-file "${raw_wav}" \
    --length-scale 1.02 \
    --volume 1.0

  raw_duration="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "${raw_wav}")"
  available_duration="$(awk -v slot="${scene_duration}" -v lead="${lead_ms}" 'BEGIN { printf "%.6f", slot - (lead / 1000) - 0.28 }')"
  tempo="$(awk -v raw="${raw_duration}" -v available="${available_duration}" 'BEGIN { if (raw > available) printf "%.6f", raw / available; else print "1.0" }')"

  ffmpeg -nostdin -hide_banner -loglevel error -y -i "${raw_wav}" \
    -af "atempo=${tempo},adelay=${lead_ms},apad=pad_dur=60,atrim=start=0:end=${scene_duration},asetpts=N/SR/TB" \
    -ar 48000 -ac 1 -c:a pcm_s16le "${slot_wav}"
  printf "file '%s'\n" "${slot_wav}" >>"${audio_concat}"

  frame_count="$((scene_duration * 30))"
  ffmpeg -nostdin -hide_banner -loglevel error -y -loop 1 -i "${image_path}" \
    -vf "scale=1960:1102:flags=lanczos,crop=1920:1080:x='20+8*sin(t*0.72)':y='11+5*cos(t*0.61)',fps=30,format=yuv420p" \
    -frames:v "${frame_count}" -an -c:v libx264 -preset ultrafast -crf 12 -g 60 -keyint_min 60 -sc_threshold 0 "${clip_path}"
  printf "file '%s'\n" "${clip_path}" >>"${video_concat}"
done 3<"${manifest_tsv}"

narration_wav="${build_dir}/audio/narration.wav"
mixed_wav="${build_dir}/audio/mixed.wav"
visual_mp4="${build_dir}/video/visual.mp4"

ffmpeg -nostdin -hide_banner -loglevel error -y -f concat -safe 0 -i "${audio_concat}" -ar 48000 -ac 1 -c:a pcm_s16le "${narration_wav}"
ffmpeg -nostdin -hide_banner -loglevel error -y -f concat -safe 0 -i "${video_concat}" -c copy "${visual_mp4}"

ffmpeg -nostdin -hide_banner -loglevel error -y \
  -i "${narration_wav}" \
  -f lavfi -i "sine=frequency=392:sample_rate=48000:duration=0.24" \
  -f lavfi -i "sine=frequency=523.25:sample_rate=48000:duration=0.24" \
  -f lavfi -i "sine=frequency=659.25:sample_rate=48000:duration=0.24" \
  -f lavfi -i "sine=frequency=783.99:sample_rate=48000:duration=0.28" \
  -f lavfi -i "sine=frequency=659.25:sample_rate=48000:duration=0.55" \
  -filter_complex \
    "[0:a]volume=1.0[voice];\
     [1:a]afade=t=out:st=0:d=0.24,volume=0.075,adelay=34000[c1];\
     [2:a]afade=t=out:st=0:d=0.24,volume=0.075,adelay=38000[c2];\
     [3:a]afade=t=out:st=0:d=0.24,volume=0.075,adelay=42000[c3];\
     [4:a]afade=t=out:st=0:d=0.28,volume=0.075,adelay=46000[c4];\
     [5:a]afade=t=out:st=0:d=0.55,volume=0.06,adelay=50000[ok];\
     [voice][c1][c2][c3][c4][ok]amix=inputs=6:duration=longest:normalize=0,\
     loudnorm=I=-16:TP=-1.5:LRA=7,atrim=start=0:end=60,apad=pad_dur=60[a]" \
  -map "[a]" -ar 48000 -ac 2 -c:a pcm_s16le "${mixed_wav}"

subtitle_filter="ass=${build_dir}/captions.ass:fontsdir=${repo_dir}/game/css/fonts"
ffmpeg -nostdin -hide_banner -loglevel error -y \
  -i "${visual_mp4}" -i "${mixed_wav}" \
  -filter:v "${subtitle_filter}" \
  -map 0:v:0 -map 1:a:0 -t 60 \
  -c:v libx264 -preset medium -crf 23 -profile:v high -level 4.1 -pix_fmt yuv420p -r 30 -g 60 \
  -c:a aac -b:a 112k -ar 48000 -ac 2 \
  -metadata title="SCRIB · Acceso y verificación de musa" \
  -metadata:s:a:0 language=spa \
  -movflags +faststart "${output_path}"

duration="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "${output_path}")"
duration_ok="$(awk -v value="${duration}" 'BEGIN { print (value >= 59.99 && value <= 60.01) ? "yes" : "no" }')"
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
if (( size_bytes > 8388608 )); then
  echo "El vídeo supera el objetivo ligero de 8 MiB: ${size_bytes} bytes" >&2
  exit 1
fi

printf 'Generado: %s\nDuración: %s s\nVídeo: %s\nAudio: %s\nTamaño: %s bytes\n' \
  "${output_path}" "${duration}" "${video_info}" "${audio_info}" "${size_bytes}"
