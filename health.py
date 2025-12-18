from http.server import BaseHTTPRequestHandler, HTTPServer

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, format, *args):
        return # Silencia logs para não poluir o console

if __name__ == "__main__":
    print("Health Check Server starting on port 8081...")
    server = HTTPServer(("0.0.0.0", 8081), HealthHandler)
    server.serve_forever()