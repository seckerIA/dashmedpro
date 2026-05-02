#!/usr/bin/env python3
"""
DashMedPro — AI Video Editor Pipeline
Remove silêncios + legendas automáticas + efeitos cinematográficos + Higgsfield AI
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Optional

# Carrega .env do diretório do script
_script_dir = Path(__file__).parent
_env_file = _script_dir / ".env"
if _env_file.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(_env_file)
    except ImportError:
        pass

# ─── Color Grade Presets ──────────────────────────────────────────────────────

COLOR_GRADES = {
    "teal_orange": {
        "description": "Hollywood clássico — sombras teal + luzes laranja",
        "curves": "r='if(lt(val,128),val*0.9,val*1.05)':g='if(lt(val,128),val*0.97,val*0.98)':b='if(lt(val,128),val*1.12,val*0.85)'",
        "eq": "contrast=1.1:brightness=-0.02:saturation=1.15",
    },
    "noir": {
        "description": "Alto contraste preto e branco com toque azul",
        "curves": "r='val*0.85':g='val*0.85':b='val*0.95'",
        "eq": "contrast=1.3:brightness=-0.05:saturation=0.15",
    },
    "warm": {
        "description": "Golden hour — tons dourados e âmbar",
        "curves": "r='min(val*1.08,255)':g='val*0.99':b='val*0.82'",
        "eq": "contrast=1.05:brightness=0.02:saturation=1.2",
    },
    "cold": {
        "description": "Tom frio e azulado — clima tenso",
        "curves": "r='val*0.88':g='val*0.95':b='min(val*1.1,255)'",
        "eq": "contrast=1.08:brightness=-0.03:saturation=0.9",
    },
}

# ─── Helpers ──────────────────────────────────────────────────────────────────

def log(msg: str, step: Optional[str] = None) -> None:
    if step:
        print(f"\033[36m{step}\033[0m {msg}", flush=True)
    else:
        print(f"  \033[90m→\033[0m {msg}", flush=True)


def run(cmd: list[str], check: bool = True, capture: bool = False) -> subprocess.CompletedProcess:
    kwargs = dict(capture_output=capture, text=True)
    result = subprocess.run(cmd, **kwargs)
    if check and result.returncode != 0:
        stderr = result.stderr if capture else ""
        raise RuntimeError(f"Comando falhou (código {result.returncode}): {' '.join(cmd)}\n{stderr}")
    return result


def check_ffmpeg() -> None:
    result = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True)
    if result.returncode != 0:
        print("\n\033[31m✗ FFmpeg não encontrado.\033[0m Instale com:")
        print("  macOS:   brew install ffmpeg")
        print("  Ubuntu:  sudo apt install ffmpeg")
        print("  Windows: https://ffmpeg.org/download.html\n")
        sys.exit(1)


def get_duration(video_path: str) -> float:
    result = run([
        "ffprobe", "-v", "quiet", "-print_format", "json",
        "-show_format", video_path
    ], capture=True)
    data = json.loads(result.stdout)
    return float(data["format"]["duration"])


def seconds_to_hms(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    if h > 0:
        return f"{h}h{m:02d}m{s:02d}s"
    return f"{m}m{s:02d}s"


# ─── Step 1: Transcrição com Whisper ─────────────────────────────────────────

def transcribe_audio(video_path: str, output_dir: Path) -> tuple[list[dict], str]:
    """Transcreve áudio usando OpenAI Whisper API. Retorna (segments, srt_content)."""
    try:
        from openai import OpenAI
    except ImportError:
        raise RuntimeError("openai não instalado. Execute: pip install -r scripts/video-editor/requirements.txt")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY não configurada. Edite scripts/video-editor/.env")

    client = OpenAI(api_key=api_key)

    # Extrai áudio em mp3 para envio (menor tamanho)
    audio_path = output_dir / "audio_temp.mp3"
    log("Extraindo áudio do vídeo...")
    run([
        "ffmpeg", "-y", "-i", video_path,
        "-vn", "-ar", "16000", "-ac", "1", "-b:a", "64k",
        str(audio_path)
    ], capture=True)

    log("Enviando para OpenAI Whisper API (pode levar alguns segundos)...")
    with open(audio_path, "rb") as f:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            response_format="verbose_json",
            timestamp_granularities=["segment"],
            language="pt",
        )

    segments = transcript.segments or []
    srt_content = _segments_to_srt(segments)

    # Salva .srt
    srt_path = output_dir / "legendas.srt"
    srt_path.write_text(srt_content, encoding="utf-8")
    log(f"Legenda salva: {srt_path}")

    audio_path.unlink(missing_ok=True)
    return segments, srt_content


def _segments_to_srt(segments: list) -> str:
    lines = []
    for i, seg in enumerate(segments, 1):
        start = _sec_to_srt_time(seg.start)
        end = _sec_to_srt_time(seg.end)
        text = seg.text.strip()
        lines.append(f"{i}\n{start} --> {end}\n{text}\n")
    return "\n".join(lines)


def _sec_to_srt_time(seconds: float) -> str:
    ms = int((seconds % 1) * 1000)
    s = int(seconds) % 60
    m = int(seconds // 60) % 60
    h = int(seconds // 3600)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


# ─── Step 2: Remoção de Silêncios ─────────────────────────────────────────────

def detect_silences(video_path: str, threshold_db: float = -35, min_duration: float = 1.5) -> list[dict]:
    """Usa ffmpeg silencedetect para encontrar intervalos silenciosos."""
    log(f"Analisando áudio (limiar: {threshold_db}dB, mín: {min_duration}s)...")
    result = run([
        "ffmpeg", "-i", video_path,
        "-af", f"silencedetect=noise={threshold_db}dB:d={min_duration}",
        "-f", "null", "-"
    ], capture=True, check=False)

    output = result.stderr
    silences = []
    starts = re.findall(r"silence_start: ([\d.]+)", output)
    ends = re.findall(r"silence_end: ([\d.]+)", output)

    for s, e in zip(starts, ends):
        silences.append({"start": float(s), "end": float(e), "duration": float(e) - float(s)})

    return silences


def remove_silences(video_path: str, silences: list[dict], output_path: str, total_duration: float) -> float:
    """Remove intervalos silenciosos e concatena partes com fala."""
    if not silences:
        log("Nenhum silêncio detectado — pulando corte.")
        return 0.0

    # Monta lista de segmentos com fala (entre os silêncios)
    segments = []
    cursor = 0.0

    for silence in silences:
        start = silence["start"]
        end = silence["end"]
        # Mantém 0.15s antes do silêncio (naturalidade)
        keep_start = cursor
        keep_end = start + 0.15
        if keep_end > keep_start + 0.1:
            segments.append((keep_start, keep_end))
        cursor = max(end - 0.15, end)

    # Último segmento até o fim
    if cursor < total_duration - 0.1:
        segments.append((cursor, total_duration))

    if not segments:
        log("Após análise, nenhum segmento de fala restante — mantendo vídeo original.")
        return 0.0

    # Gera filtro select/aselect para FFmpeg
    video_selects = "+".join(
        f"between(t,{s:.3f},{e:.3f})" for s, e in segments
    )
    audio_selects = video_selects

    removed = total_duration - sum(e - s for s, e in segments)
    log(f"Detectados {len(silences)} silêncios (total a remover: {seconds_to_hms(removed)})")

    run([
        "ffmpeg", "-y", "-i", video_path,
        "-vf", f"select='{video_selects}',setpts=N/FRAME_RATE/TB",
        "-af", f"aselect='{audio_selects}',asetpts=N/SR/TB",
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k",
        output_path
    ], capture=True)

    return removed


# ─── Step 3: Efeitos Cinematográficos ─────────────────────────────────────────

def apply_cinematic_effects(input_path: str, output_path: str, style: str = "teal_orange") -> None:
    """Aplica color grade, letterbox 2.39:1, film grain e vinheta."""
    grade = COLOR_GRADES.get(style, COLOR_GRADES["teal_orange"])
    log(f"Color grade: {style} — {grade['description']}")
    log("Aplicando letterbox 2.39:1 (cinema scope)...")
    log("Aplicando film grain + vinheta...")

    # Detecta resolução de entrada
    probe = run([
        "ffprobe", "-v", "quiet", "-print_format", "json",
        "-show_streams", "-select_streams", "v:0", input_path
    ], capture=True)
    streams = json.loads(probe.stdout).get("streams", [{}])
    width = streams[0].get("width", 1920)
    height = streams[0].get("height", 1080)

    # Calcula altura para letterbox 2.39:1
    cinema_height = int(width / 2.39)
    pad_y = (height - cinema_height) // 2

    # Monta filtro complexo
    filter_complex = (
        # 1. Color curves (color grade)
        f"curves={grade['curves']},"
        # 2. EQ (contraste, brilho, saturação)
        f"eq={grade['eq']},"
        # 3. Letterbox — crop para 2.39:1
        f"crop={width}:{cinema_height}:0:{pad_y},"
        # 4. Pad de volta para resolução original (barras pretas)
        f"pad={width}:{height}:0:{pad_y}:black,"
        # 5. Film grain via noise (textura de película)
        f"noise=alls=14:allf=t+u,"
        # 6. Vinheta suave nas bordas
        f"vignette=PI/5:eval=frame"
    )

    run([
        "ffmpeg", "-y", "-i", input_path,
        "-vf", filter_complex,
        "-c:v", "libx264", "-preset", "slow", "-crf", "17",
        "-c:a", "copy",
        output_path
    ], capture=True)


# ─── Step 4: Legendas ─────────────────────────────────────────────────────────

def burn_subtitles(input_path: str, srt_path: str, output_path: str) -> None:
    """Queima legendas no vídeo com estilo cinematográfico."""
    log("Queimando legendas (fonte bold, sombra, posição inferior)...")

    # Estilo ASS para legendas cinematográficas
    subtitle_filter = (
        f"subtitles='{srt_path}':force_style='"
        "FontName=Helvetica Neue,"
        "FontSize=22,"
        "Bold=1,"
        "PrimaryColour=&H00FFFFFF,"
        "OutlineColour=&H00000000,"
        "BackColour=&H80000000,"
        "Outline=2,"
        "Shadow=1,"
        "Alignment=2,"
        "MarginV=30"
        "'"
    )

    run([
        "ffmpeg", "-y", "-i", input_path,
        "-vf", subtitle_filter,
        "-c:v", "libx264", "-preset", "fast", "-crf", "17",
        "-c:a", "copy",
        output_path
    ], capture=True)


# ─── Step 5: Higgsfield AI ────────────────────────────────────────────────────

def generate_higgsfield_intro(video_path: str, output_dir: Path, prompt: Optional[str] = None) -> Optional[str]:
    """Gera intro cinematográfico usando Higgsfield API."""
    try:
        from higgsfield_client import HiggsFieldClient
    except ImportError:
        log("higgsfield_client não encontrado — pulando Higgsfield.")
        return None

    api_key = os.getenv("HIGGSFIELD_API_KEY")
    if not api_key:
        log("HIGGSFIELD_API_KEY não configurada — pulando Higgsfield.")
        return None

    if not prompt:
        prompt = (
            "Cinematic establishing shot, dramatic lighting, shallow depth of field, "
            "anamorphic lens flare, 4K resolution, professional film look, "
            "teal and orange color grade, dark atmospheric mood"
        )

    log(f"Gerando intro cinematográfico via Higgsfield AI...")
    log(f"Prompt: {prompt[:80]}...")

    client = HiggsFieldClient(api_key=api_key)

    # Extrai frame do início do vídeo para usar como image-to-video
    frame_path = output_dir / "higgsfield_frame.jpg"
    run([
        "ffmpeg", "-y", "-i", video_path,
        "-vf", "select=eq(n\\,0)", "-q:v", "2",
        "-vframes", "1", str(frame_path)
    ], capture=True)

    try:
        result = client.image_to_video(
            image_path=str(frame_path),
            prompt=prompt,
            motion_preset="cinematic_push",
        )
        if result:
            intro_path = output_dir / "higgsfield_intro.mp4"
            log(f"Intro gerado: {intro_path}")
            return str(intro_path)
    except Exception as e:
        log(f"Higgsfield erro: {e} — continuando sem intro.")

    return None


# ─── Pipeline Principal ────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="AI Video Editor: silêncios + legendas + efeitos cinematográficos"
    )
    parser.add_argument("video", help="Caminho do vídeo de entrada")
    parser.add_argument("--no-silence", action="store_true", help="Pula remoção de silêncios")
    parser.add_argument("--no-subtitles", action="store_true", help="Pula geração de legendas")
    parser.add_argument("--no-effects", action="store_true", help="Pula efeitos cinematográficos")
    parser.add_argument("--higgsfield", action="store_true", help="Gera intro via Higgsfield API")
    parser.add_argument("--silence-threshold", type=float, default=1.5, metavar="SEGUNDOS",
                        help="Duração mínima do silêncio para remover (padrão: 1.5s)")
    parser.add_argument("--style", choices=list(COLOR_GRADES.keys()), default="teal_orange",
                        help="Estilo de color grade (padrão: teal_orange)")
    parser.add_argument("--output", help="Caminho do vídeo de saída")
    parser.add_argument("--verbose", action="store_true", help="Output detalhado")
    args = parser.parse_args()

    # Verifica FFmpeg
    check_ffmpeg()

    # Verifica arquivo de entrada
    video_path = Path(args.video).resolve()
    if not video_path.exists():
        print(f"\033[31m✗ Arquivo não encontrado:\033[0m {video_path}")
        sys.exit(1)

    # Define saída
    if args.output:
        output_path = Path(args.output).resolve()
    else:
        stem = video_path.stem
        output_path = video_path.parent / f"{stem}_cinema.mp4"
        # Evita sobrescrever
        if output_path.exists():
            ts = int(time.time())
            output_path = video_path.parent / f"{stem}_cinema_{ts}.mp4"

    print(f"\n\033[1m🎬 AI Video Editor — DashMedPro\033[0m")
    print(f"  Entrada:  {video_path}")
    print(f"  Saída:    {output_path}")
    print(f"  Estilo:   {args.style}")
    print()

    original_duration = get_duration(str(video_path))
    print(f"  Duração original: {seconds_to_hms(original_duration)}\n")

    with tempfile.TemporaryDirectory(prefix="videoedit_") as tmpdir:
        tmp = Path(tmpdir)
        current_input = str(video_path)
        removed_seconds = 0.0
        srt_path = None
        step = 0

        # ── STEP 1: Transcrição ────────────────────────────────────────────
        if not args.no_subtitles:
            step += 1
            total_steps = sum([
                not args.no_subtitles,
                not args.no_silence,
                not args.no_effects,
            ]) + (1 if not args.no_subtitles else 0)

            log("Transcrevendo áudio com Whisper...", f"[STEP {step}/4]")
            try:
                segments, _ = transcribe_audio(current_input, tmp)
                srt_path = str(tmp / "legendas.srt")
                log(f"Transcrição concluída: {len(segments)} segmentos")
            except Exception as e:
                print(f"  \033[33m⚠ Transcrição falhou: {e}\033[0m")
                print("  Continuando sem legendas (use --no-subtitles para suprimir este aviso).")
                srt_path = None

        # ── STEP 2: Remoção de Silêncios ──────────────────────────────────
        if not args.no_silence:
            step += 1
            log("Removendo silêncios...", f"[STEP {step}/4]")
            silence_output = str(tmp / "no_silence.mp4")
            try:
                silences = detect_silences(current_input, min_duration=args.silence_threshold)
                if silences:
                    removed_seconds = remove_silences(
                        current_input, silences, silence_output, original_duration
                    )
                    current_input = silence_output
                    log(f"✓ {len(silences)} silêncios removidos ({seconds_to_hms(removed_seconds)} economizados)")
                else:
                    log("Nenhum silêncio encontrado — vídeo mantido intacto.")
            except Exception as e:
                print(f"  \033[33m⚠ Remoção de silêncios falhou: {e}\033[0m")

        # ── STEP 3: Efeitos Cinematográficos ──────────────────────────────
        if not args.no_effects:
            step += 1
            log(f"Aplicando efeitos cinematográficos ({args.style})...", f"[STEP {step}/4]")
            effects_output = str(tmp / "with_effects.mp4")
            try:
                apply_cinematic_effects(current_input, effects_output, style=args.style)
                current_input = effects_output
                log("✓ Color grade + letterbox + film grain + vinheta aplicados")
            except Exception as e:
                print(f"  \033[33m⚠ Efeitos cinematográficos falharam: {e}\033[0m")

        # ── STEP 4: Queima de Legendas ────────────────────────────────────
        if srt_path and Path(srt_path).exists():
            step += 1
            log("Queimando legendas no vídeo...", f"[STEP {step}/4]")
            subtitled_output = str(tmp / "with_subtitles.mp4")
            try:
                burn_subtitles(current_input, srt_path, subtitled_output)
                current_input = subtitled_output
                log("✓ Legendas aplicadas")
            except Exception as e:
                print(f"  \033[33m⚠ Queima de legendas falhou: {e}\033[0m")

        # ── STEP 5: Higgsfield (opcional) ─────────────────────────────────
        if args.higgsfield:
            step += 1
            log("Gerando intro cinematográfico via Higgsfield AI...", f"[STEP {step}/4]")
            try:
                intro = generate_higgsfield_intro(str(video_path), tmp)
                if intro:
                    # Concatena intro + vídeo processado
                    concat_list = tmp / "concat.txt"
                    concat_list.write_text(
                        f"file '{intro}'\nfile '{current_input}'\n"
                    )
                    final_with_intro = str(tmp / "with_intro.mp4")
                    run([
                        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
                        "-i", str(concat_list),
                        "-c:v", "libx264", "-preset", "fast", "-crf", "17",
                        "-c:a", "aac", "-b:a", "192k",
                        final_with_intro
                    ], capture=True)
                    current_input = final_with_intro
                    log("✓ Intro Higgsfield concatenado")
            except Exception as e:
                log(f"Higgsfield falhou: {e} — vídeo final sem intro.")

        # ── Copia resultado final para output_path ─────────────────────────
        import shutil
        shutil.copy2(current_input, str(output_path))

        # Copia também o .srt para a pasta de saída
        if srt_path and Path(srt_path).exists():
            final_srt = output_path.parent / f"{output_path.stem}.srt"
            shutil.copy2(srt_path, str(final_srt))

    # Relatório final
    final_duration = get_duration(str(output_path))
    print(f"\n\033[32m✓ CONCLUÍDO\033[0m")
    print(f"  Vídeo final:      {output_path}")
    if not args.no_subtitles and srt_path:
        final_srt = output_path.parent / f"{output_path.stem}.srt"
        print(f"  Legendas (.srt):  {final_srt}")
    print(f"  Duração original: {seconds_to_hms(original_duration)}")
    print(f"  Duração final:    {seconds_to_hms(final_duration)}", end="")
    if removed_seconds > 0:
        print(f"  \033[36m(-{seconds_to_hms(removed_seconds)} de silêncios)\033[0m", end="")
    print()
    if not args.no_effects:
        print(f"  Color grade:      {args.style} — {COLOR_GRADES[args.style]['description']}")
    print()


if __name__ == "__main__":
    main()
