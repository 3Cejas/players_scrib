#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd -- "${script_dir}/.." && pwd)"
manifest_path="${script_dir}/tutorial-scrib-narration.json"
output_path="${repo_dir}/game/media/tutorial-scrib-audio.mp3"
tts_cache="${SCRIB_TTS_CACHE_DIR:-/tmp/scrib-tutorial-tts-cache}"
keep_build="${SCRIB_KEEP_TUTORIAL_BUILD:-0}"

for command_name in node ffmpeg ffprobe curl python3; do
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Falta la herramienta requerida: ${command_name}" >&2
    exit 1
  fi
done

if [[ -n "${SCRIB_TUTORIAL_BUILD_DIR:-}" ]]; then
  build_dir="${SCRIB_TUTORIAL_BUILD_DIR}"
  mkdir -p "${build_dir}"
else
  build_dir="$(mktemp -d /tmp/scrib-tutorial-audio.XXXXXX)"
fi

cleanup() {
  if [[ "${keep_build}" != "1" && -z "${SCRIB_TUTORIAL_BUILD_DIR:-}" ]]; then
    rm -rf -- "${build_dir}"
  else
    echo "Build conservado en ${build_dir}"
  fi
}
trap cleanup EXIT

mkdir -p "${tts_cache}/site" "${build_dir}/raw" "${build_dir}/slots" "${build_dir}/text"

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

manifest_tsv="${build_dir}/manifest.tsv"
node - "${manifest_path}" "${build_dir}/text" >"${manifest_tsv}" <<'NODE'
const fs = require("fs");
const path = require("path");
const manifest = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const textDir = process.argv[3];
for (const scene of manifest) {
  const textPath = path.join(textDir, `${scene.key}.txt`);
  fs.writeFileSync(textPath, `${scene.text}\n`, "utf8");
  process.stdout.write([
    scene.key,
    scene.duration,
    scene.leadMs,
    scene.rate,
    scene.pitch,
    textPath
  ].join("\t") + "\n");
}
NODE

total_duration="$(node -e 'const s=require(process.argv[1]);const x=s.at(-1);process.stdout.write(String(x.start+x.duration));' "${manifest_path}")"
music_fade_start="$(awk -v total="${total_duration}" 'BEGIN { printf "%.3f", total - 4 }')"
audio_concat="${build_dir}/slots.txt"
: >"${audio_concat}"

while IFS=$'\t' read -r scene_key scene_duration lead_ms voice_rate voice_pitch narration_path; do
  raw_audio="${build_dir}/raw/${scene_key}.mp3"
  slot_wav="${build_dir}/slots/${scene_key}.wav"
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
  tempo_too_high="$(awk -v raw="${raw_duration}" -v available="${available_duration}" 'BEGIN { print (raw / available > 1.12) ? "yes" : "no" }')"
  if [[ "${tempo_too_high}" == "yes" ]]; then
    echo "La locución de ${scene_key} requiere demasiada aceleración (${raw_duration}s en ${available_duration}s)." >&2
    exit 1
  fi
  tempo="$(awk -v raw="${raw_duration}" -v available="${available_duration}" 'BEGIN { if (raw > available) printf "%.6f", raw / available; else print "1.0" }')"

  ffmpeg -nostdin -hide_banner -loglevel error -y -i "${raw_audio}" \
    -af "atempo=${tempo},adelay=${lead_ms},apad=pad_dur=${scene_duration},atrim=start=0:end=${scene_duration},asetpts=N/SR/TB" \
    -ar 48000 -ac 1 -c:a pcm_s16le "${slot_wav}"
  printf "file '%s'\n" "${slot_wav}" >>"${audio_concat}"
done <"${manifest_tsv}"

narration_wav="${build_dir}/narration.wav"
ffmpeg -nostdin -hide_banner -loglevel error -y -f concat -safe 0 -i "${audio_concat}" -ar 48000 -ac 1 -c:a pcm_s16le "${narration_wav}"

ffmpeg -nostdin -hide_banner -loglevel error -y \
  -i "${narration_wav}" \
  -f lavfi -i "sine=frequency=392:sample_rate=48000:duration=0.26" \
  -f lavfi -i "sine=frequency=523.25:sample_rate=48000:duration=0.26" \
  -f lavfi -i "sine=frequency=659.25:sample_rate=48000:duration=0.26" \
  -f lavfi -i "sine=frequency=783.99:sample_rate=48000:duration=0.3" \
  -f lavfi -i "sine=frequency=659.25:sample_rate=48000:duration=0.65" \
  -stream_loop -1 -i "${repo_dir}/game/audio/2. ACOMPAÑAR VOZ CON MELODIA.mp3" \
  -filter_complex \
    "[0:a]volume=1.0,asplit=2[voice][voice_sidechain];\
     [1:a]afade=t=out:st=0:d=0.26,volume=0.075,adelay=95000[c1];\
     [2:a]afade=t=out:st=0:d=0.26,volume=0.075,adelay=102000[c2];\
     [3:a]afade=t=out:st=0:d=0.26,volume=0.075,adelay=109000[c3];\
     [4:a]afade=t=out:st=0:d=0.3,volume=0.075,adelay=116000[c4];\
     [5:a]afade=t=out:st=0:d=0.65,volume=0.07,adelay=123000[ok];\
     [6:a]volume=0.16,afade=t=in:st=0:d=1.4,afade=t=out:st=${music_fade_start}:d=4,atrim=start=0:end=${total_duration}[music];\
     [music][voice_sidechain]sidechaincompress=threshold=0.025:ratio=8:attack=18:release=420[music_ducked];\
     [voice][music_ducked][c1][c2][c3][c4][ok]amix=inputs=7:duration=longest:normalize=0,\
     loudnorm=I=-16:TP=-1.5:LRA=7,atrim=start=0:end=${total_duration},apad=pad_dur=${total_duration}[a]" \
  -map "[a]" -t "${total_duration}" -ar 48000 -ac 2 -c:a libmp3lame -b:a 160k \
  -metadata title="SCRIB · Tutorial animado de musas" \
  -metadata language="spa" "${output_path}"

duration="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "${output_path}")"
duration_ok="$(awk -v value="${duration}" -v expected="${total_duration}" 'BEGIN { print (value >= expected - 0.08 && value <= expected + 0.08) ? "yes" : "no" }')"
if [[ "${duration_ok}" != "yes" ]]; then
  echo "Duración inesperada: ${duration} s" >&2
  exit 1
fi

printf 'Generado: %s\nDuración: %s s\nTamaño: %s bytes\n' "${output_path}" "${duration}" "$(stat -c '%s' "${output_path}")"
