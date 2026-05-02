---
name: "video-editor"
description: "Editor de vídeo AI: remove silêncios, gera legendas automáticas e aplica efeitos cinematográficos. Integra Higgsfield API (efeitos AI) + OpenAI Whisper (transcrição) + FFmpeg (processamento)."
argument-hint: "Caminho do vídeo. Ex: /caminho/video.mp4 ou 'video.mp4 --no-effects'"
user-invocable: true
disable-model-invocation: false
---

## User Input

```text
$ARGUMENTS
```

## Visão Geral

Quando o usuário invocar `/video-editor`, você vai orquestrar um pipeline completo de edição de vídeo AI com 4 etapas:

1. **Transcrição + Legendas** — OpenAI Whisper API gera SRT com timestamps precisos
2. **Remoção de Silêncios** — FFmpeg detecta e corta pausas > 1.5s automaticamente
3. **Efeitos Cinematográficos** — FFmpeg aplica color grade, letterbox 2.39:1, film grain, vinheta
4. **Higgsfield AI** (opcional) — Gera intro/outro ou B-roll cinematográfico via Higgsfield API

## Flags Disponíveis

- `--no-silence` — Pula remoção de silêncios
- `--no-subtitles` — Pula geração de legendas
- `--no-effects` — Pula efeitos cinematográficos FFmpeg
- `--higgsfield` — Ativa geração de intro cinematográfico via Higgsfield API
- `--silence-threshold=N` — Limiar em segundos (padrão: 1.5)
- `--output=PATH` — Caminho de saída (padrão: `[nome]_cinema.mp4` na mesma pasta)
- `--style=STYLE` — Estilo cinematográfico: `teal_orange` (padrão), `noir`, `warm`, `cold`

## Outline

### Passo 1 — Parsear entrada

Parse `$ARGUMENTS`:
- Se vazio: pergunte o caminho do vídeo antes de prosseguir
- Primeiro argumento posicional = caminho do vídeo
- Flags opcionais: `--no-silence`, `--no-subtitles`, `--no-effects`, `--higgsfield`, etc.

**Validações:**
- Verificar se o arquivo existe: `test -f "<video_path>"`
- Se não existir: informe o erro claramente e pare

### Passo 2 — Verificar dependências

Execute os seguintes checks em paralelo:

```bash
# Verificar FFmpeg
ffmpeg -version 2>&1 | head -1

# Verificar Python 3
python3 --version 2>&1

# Verificar pip packages instalados
python3 -c "import openai, dotenv" 2>&1

# Verificar variáveis de ambiente (arquivo .env ou ambiente)
python3 -c "
import os, sys
from pathlib import Path

# Tenta carregar .env do diretório scripts/video-editor
env_file = Path('scripts/video-editor/.env')
if env_file.exists():
    from dotenv import load_dotenv
    load_dotenv(env_file)

missing = []
if not os.getenv('OPENAI_API_KEY'): missing.append('OPENAI_API_KEY')
if not os.getenv('HIGGSFIELD_API_KEY'): missing.append('HIGGSFIELD_API_KEY (opcional, só necessária com --higgsfield)')
if missing:
    print('AVISO — variáveis ausentes:', ', '.join(missing))
else:
    print('OK — todas variáveis configuradas')
" 2>&1
```

**Se FFmpeg não estiver instalado:**
```
Informe ao usuário:
  FFmpeg não encontrado. Instale com:
  - macOS: brew install ffmpeg
  - Ubuntu/Debian: sudo apt install ffmpeg
  - Windows: https://ffmpeg.org/download.html (adicione ao PATH)
  
  Após instalar, execute /video-editor novamente.
```

**Se Python packages estiverem faltando:**
```
Informe ao usuário e execute:
  cd scripts/video-editor && pip install -r requirements.txt
```

**Se OPENAI_API_KEY estiver faltando:**
```
Informe ao usuário:
  Configure OPENAI_API_KEY em scripts/video-editor/.env
  Copie o template: cp scripts/video-editor/.env.example scripts/video-editor/.env
  Edite e adicione sua chave: OPENAI_API_KEY=sk-...
```

### Passo 3 — Montar comando de execução

Com base nas flags, monte o comando:

```bash
python3 scripts/video-editor/process.py \
  "<video_path>" \
  [--no-silence] \
  [--no-subtitles] \
  [--no-effects] \
  [--higgsfield] \
  [--silence-threshold=1.5] \
  [--output="<output_path>"] \
  [--style="teal_orange"] \
  --verbose
```

### Passo 4 — Executar pipeline

Execute o comando e monitore o output em tempo real. O script imprime progresso no formato:
```
[STEP 1/4] Transcrevendo áudio com Whisper...
[STEP 2/4] Removendo silêncios...
  → Detectados 12 silêncios (total: 47.3s removidos)
[STEP 3/4] Aplicando efeitos cinematográficos...
  → Color grade: teal_orange
  → Letterbox: 2.39:1 (cinema scope)
  → Film grain + vignette aplicados
[STEP 4/4] Queimando legendas no vídeo...
[DONE] Vídeo salvo em: /caminho/video_cinema.mp4
  Duração original: 5m 23s → Final: 4m 36s (47s removidos)
```

Exiba esse progresso ao usuário conforme aparecer.

### Passo 5 — Reportar resultado

Ao finalizar, informe:
- Caminho do arquivo de saída
- Duração original vs final (tempo economizado)
- Quantos silêncios foram removidos
- Qual color grade foi aplicado
- Se legendas foram geradas e o caminho do .srt
- Se Higgsfield foi usado: URL do vídeo gerado

### Tratamento de Erros

| Erro | Ação |
|------|------|
| Arquivo de vídeo não encontrado | Informe o caminho e peça o correto |
| FFmpeg não instalado | Mostre instruções de instalação por OS |
| OPENAI_API_KEY inválida | Mostre onde configurar |
| Quota OpenAI excedida | Sugira usar `--no-subtitles` |
| Higgsfield API erro | Informe e continue sem o Higgsfield (não cancela pipeline) |
| Arquivo de saída já existe | Adicione timestamp ao nome automaticamente |
| Vídeo muito longo (>2h) | Avise que pode demorar e continue |

## Exemplos de Uso

```
/video-editor video.mp4
/video-editor /home/user/videos/palestra.mp4 --style=noir
/video-editor gravacao.mp4 --no-silence --higgsfield
/video-editor entrevista.mp4 --silence-threshold=2.0 --output=resultado_final.mp4
/video-editor video.mp4 --no-effects --no-silence (só legendas)
```

## Notas Técnicas

- **Letterbox cinema**: aspect ratio 2.39:1 com barras pretas (cinema scope clássico)
- **Color grades disponíveis**:
  - `teal_orange`: O clássico Hollywood — sombras frias (teal) + tons quentes (orange) nas luzes
  - `noir`: Alto contraste, preto e branco com leve toque azul nas sombras
  - `warm`: Golden hour — tons dourados/âmbar, atmosfera quente
  - `cold`: Tom frio e azulado, clima tenso ou clínico
- **Film grain**: Textura de película 35mm, intensidade 12-18 (sutil mas presente)
- **Vinheta**: Escurecimento suave nas bordas, foco no centro
- **Silêncios**: detectados por `silencedetect` do FFmpeg, limiar padrão -35dB por 1.5s
- **Legendas**: Fonte Helvetica Neue Bold, tamanho 24px, cor branca com sombra preta, posição inferior centro
