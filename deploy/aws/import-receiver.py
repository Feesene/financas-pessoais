#!/usr/bin/env python3
"""Receptor de uso único para o export de dados (migração Supabase -> AWS).

O bootstrap só inicia este processo quando recebe IMPORT_TOKEN. Ele aceita UM `PUT /_import`
(via Caddy/HTTPS) com o header `X-Import-Token` correto, grava o JSON em
/opt/financas/import/data.json e encerra. O deploy.sh importa o arquivo no banco em seguida.
A porta 9099 não é aberta no firewall do Lightsail: só o Caddy (rede local) alcança o receptor.
"""
import hmac
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

IMPORT_DIR = os.environ.get("IMPORT_DIR", "/opt/financas/import")
TOKEN_FILE = os.path.join(IMPORT_DIR, "token")
DEST = os.path.join(IMPORT_DIR, "data.json")
MAX_BYTES = 5 * 1024 * 1024


class Handler(BaseHTTPRequestHandler):
    def _reply(self, code: int, msg: str) -> None:
        body = (msg + "\n").encode()
        self.send_response(code)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_PUT(self) -> None:  # noqa: N802 (nome exigido pelo http.server)
        with open(TOKEN_FILE, encoding="utf-8") as f:
            expected = f.read().strip()
        received = self.headers.get("X-Import-Token", "")
        if not expected or not hmac.compare_digest(received, expected):
            self._reply(403, "token invalido")
            return
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > MAX_BYTES:
            self._reply(413, "tamanho invalido")
            return
        data = self.rfile.read(length)
        try:
            parsed = json.loads(data)
            assert isinstance(parsed, dict) and "lancamentos" in parsed
        except (ValueError, AssertionError):
            self._reply(400, "JSON invalido")
            return
        tmp = DEST + ".tmp"
        fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        os.replace(tmp, DEST)
        os.remove(TOKEN_FILE)
        counts = {k: len(v) for k, v in parsed.items() if isinstance(v, list)}
        self._reply(200, "recebido: " + json.dumps(counts, sort_keys=True))
        self.server.done = True  # type: ignore[attr-defined]

    def log_message(self, fmt: str, *args) -> None:  # sem corpo/headers no log
        sys.stderr.write("import-receiver: " + (fmt % args) + "\n")


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", 9099), Handler)
    server.done = False  # type: ignore[attr-defined]
    while not server.done:  # type: ignore[attr-defined]
        server.handle_request()
