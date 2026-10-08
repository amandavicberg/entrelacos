"""Serve a pasta dist com fallback para rotas do Expo Router no navegador."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from http.client import HTTPConnection
from pathlib import Path
from urllib.parse import urlsplit


DIST = Path(__file__).resolve().parent.parent / "dist"


class ExpoPreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def _route(self):
        path = urlsplit(self.path).path
        if path == "/":
            return
        file_path = Path(self.translate_path(path))
        if file_path.is_file():
            return
        if not Path(path).suffix:
            html = Path(self.translate_path(path + ".html"))
            self.path = path + ".html" if html.is_file() else "/index.html"

    def do_GET(self):
        if self._proxy_api():
            return
        self._route()
        super().do_GET()

    def do_HEAD(self):
        if self._proxy_api():
            return
        self._route()
        super().do_HEAD()

    def do_POST(self):
        if not self._proxy_api():
            self.send_error(404)

    def do_PATCH(self):
        if not self._proxy_api():
            self.send_error(404)

    def do_PUT(self):
        if not self._proxy_api():
            self.send_error(404)

    def do_DELETE(self):
        if not self._proxy_api():
            self.send_error(404)

    def do_OPTIONS(self):
        if not self._proxy_api():
            self.send_error(404)

    def _proxy_api(self):
        if not urlsplit(self.path).path.startswith("/v1/"):
            return False
        body = self.rfile.read(int(self.headers.get("Content-Length", "0")))
        headers = {key: value for key in ("Authorization", "Content-Type", "Accept")
                   if (value := self.headers.get(key))}
        connection = HTTPConnection("127.0.0.1", 3333, timeout=20)
        try:
            connection.request(self.command, self.path, body=body, headers=headers)
            upstream = connection.getresponse()
            payload = upstream.read()
            self.send_response(upstream.status)
            self.send_header("Content-Type", upstream.getheader("Content-Type", "application/json"))
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(payload)
        except OSError:
            payload = b'{"error":"A API local nao esta disponivel."}'
            self.send_response(502)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(payload)
        finally:
            connection.close()
        return True

    def log_message(self, format, *args):
        if urlsplit(self.path).path.startswith("/v1/"):
            return
        super().log_message(format, *args)


if __name__ == "__main__":
    print("Prévia web: http://127.0.0.1:8083", flush=True)
    ThreadingHTTPServer(("127.0.0.1", 8083), ExpoPreviewHandler).serve_forever()
