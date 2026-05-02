"""
Higgsfield AI API Client
Documentação: https://cloud.higgsfield.ai/api-keys
SDK oficial: higgsfield-js (Node) / higgsfield-client (Python)

Endpoints:
  POST /v1/generations       — submete geração
  GET  /v1/generations/{id}  — consulta status
"""

import os
import time
import urllib.request
import json
from pathlib import Path
from typing import Optional


BASE_URL = "https://api.higgsfield.ai"
DEFAULT_TIMEOUT = 300  # 5 minutos


class HiggsFieldClient:
    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key or os.getenv("HIGGSFIELD_API_KEY")
        if not self.api_key:
            raise ValueError("HIGGSFIELD_API_KEY não configurada.")

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _request(self, method: str, path: str, body: Optional[dict] = None) -> dict:
        url = f"{BASE_URL}{path}"
        data = json.dumps(body).encode("utf-8") if body else None
        req = urllib.request.Request(url, data=data, headers=self._headers(), method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            raise RuntimeError(f"Higgsfield API {e.code}: {error_body}") from e

    def submit(self, prompt: str, image_url: Optional[str] = None,
               motion_id: Optional[str] = None, enhance_prompt: bool = True) -> str:
        """Submete geração. Retorna generation_id."""
        payload: dict = {
            "prompt": prompt,
            "enhance_prompt": enhance_prompt,
        }
        if image_url:
            payload["image_url"] = image_url
        if motion_id:
            payload["motion_id"] = motion_id

        response = self._request("POST", "/v1/generations", payload)
        generation_id = response.get("generation_id") or response.get("id")
        if not generation_id:
            raise RuntimeError(f"Higgsfield não retornou generation_id: {response}")
        return generation_id

    def status(self, generation_id: str) -> dict:
        """Consulta status de uma geração."""
        return self._request("GET", f"/v1/generations/{generation_id}")

    def wait(self, generation_id: str, timeout: int = DEFAULT_TIMEOUT,
             poll_interval: int = 5) -> dict:
        """Aguarda conclusão da geração com polling. Retorna o resultado completo."""
        start = time.time()
        while True:
            elapsed = time.time() - start
            if elapsed > timeout:
                raise TimeoutError(f"Higgsfield: timeout após {timeout}s aguardando {generation_id}")

            result = self.status(generation_id)
            status = (result.get("status") or "").lower()

            if status in ("completed", "success"):
                return result
            elif status in ("failed", "nsfw", "cancelled"):
                raise RuntimeError(f"Higgsfield geração {generation_id} falhou com status: {status}")

            time.sleep(poll_interval)

    def upload_image(self, image_path: str) -> str:
        """Faz upload de imagem local e retorna URL pública."""
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"Imagem não encontrada: {image_path}")

        # Higgsfield aceita upload via multipart — usa urllib3 se disponível, senão requests
        try:
            import requests
            with open(image_path, "rb") as f:
                resp = requests.post(
                    f"{BASE_URL}/v1/uploads",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    files={"file": (path.name, f, "image/jpeg")},
                    timeout=60,
                )
            resp.raise_for_status()
            data = resp.json()
            return data.get("url") or data.get("image_url", "")
        except ImportError:
            raise RuntimeError(
                "Instale requests para upload de imagem: pip install requests"
            )

    def download_video(self, result: dict, output_path: str) -> str:
        """Baixa o vídeo gerado para disco. Retorna caminho local."""
        video_url = (
            result.get("video_url")
            or result.get("output")
            or result.get("url")
        )
        if not video_url:
            raise RuntimeError(f"URL do vídeo não encontrada no resultado: {result}")

        output = Path(output_path)
        output.parent.mkdir(parents=True, exist_ok=True)

        req = urllib.request.Request(video_url)
        with urllib.request.urlopen(req, timeout=120) as resp:
            output.write_bytes(resp.read())

        return str(output)

    def text_to_video(self, prompt: str, motion_id: Optional[str] = None,
                      output_path: Optional[str] = None) -> Optional[str]:
        """Pipeline completo: text → geração → aguarda → download."""
        generation_id = self.submit(prompt, motion_id=motion_id)
        result = self.wait(generation_id)

        if output_path:
            return self.download_video(result, output_path)

        return result.get("video_url") or result.get("output")

    def image_to_video(self, image_path: str, prompt: str,
                       motion_preset: Optional[str] = None,
                       output_path: Optional[str] = None) -> Optional[str]:
        """Pipeline completo: imagem local → upload → geração → aguarda → download."""

        # Motion presets cinematográficos da Higgsfield DoP API
        MOTION_PRESETS = {
            "cinematic_push": None,  # será resolvido via API se disponível
            "slow_zoom": None,
            "orbital": None,
            "tracking": None,
        }

        # Upload da imagem para obter URL pública
        image_url = self.upload_image(image_path)

        motion_id = MOTION_PRESETS.get(motion_preset) if motion_preset else None
        generation_id = self.submit(prompt, image_url=image_url, motion_id=motion_id)
        result = self.wait(generation_id)

        if output_path:
            return self.download_video(result, output_path)

        return result.get("video_url") or result.get("output")
