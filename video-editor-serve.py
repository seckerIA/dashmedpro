#!/usr/bin/env python3
"""
Servidor local para o AI Video Editor.
Necessário para o FFmpeg.wasm funcionar (requer SharedArrayBuffer).

Uso:
  python video-editor-serve.py
  → Abra http://localhost:8080/video-editor.html
"""
import http.server
import socketserver
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Headers obrigatórios para SharedArrayBuffer (FFmpeg.wasm)
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
        super().end_headers()

    def log_message(self, format, *args):
        pass  # silencia logs de cada request

print(f"\n🎬 AI Video Editor — servidor rodando")
print(f"   Abra no navegador: \033[36mhttp://localhost:{PORT}/video-editor.html\033[0m")
print(f"   Ctrl+C para parar\n")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
