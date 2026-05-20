#!/usr/bin/env python3
"""Local helper that saves POSTed screenshot bodies to tools/out/.

Bridges Chrome MCP screenshots to local disk via the storyboard runbook.
Listens on 127.0.0.1:9999 and is CORS-permissive so a page on localhost:8787
can POST raw PNG bytes to it.

Run from the project root:
  python3 tools/_save_screenshot.py
"""
import http.server
import os
import sys
import urllib.parse

OUT_ROOT = os.path.abspath("tools/out")


class Handler(http.server.BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        qs = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(qs)
        name = params.get("name", ["screenshot.png"])[0]
        safe = "".join(c for c in name if c.isalnum() or c in "-_./")
        if ".." in safe or safe.startswith("/"):
            self.send_response(400)
            self._cors()
            self.end_headers()
            self.wfile.write(b"bad name")
            return
        target = os.path.join(OUT_ROOT, safe)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        with open(target, "wb") as f:
            f.write(body)
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(target.encode())

    def log_message(self, fmt, *args):
        sys.stderr.write("[save_screenshot] " + (fmt % args) + "\n")


if __name__ == "__main__":
    os.makedirs(OUT_ROOT, exist_ok=True)
    http.server.HTTPServer(("127.0.0.1", 9999), Handler).serve_forever()
