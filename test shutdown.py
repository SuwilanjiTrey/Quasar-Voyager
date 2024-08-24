import threading
import flask
import logging
from werkzeug.serving import make_server

log = logging.getLogger(__name__)
server = None

class ServerThread(threading.Thread):
    def __init__(self, app):
        threading.Thread.__init__(self)
        self.server = make_server('127.0.0.1', 5000, app)
        self.ctx = app.app_context()
        self.ctx.push()

    def run(self):
        log.info('Starting server')
        self.server.serve_forever()

    def shutdown(self):
        log.info('Stopping server')
        self.server.shutdown()

def start_server():
    global server
    app = flask.Flask('myapp')

    @app.route('/')
    def index():
        return 'Hello, World!'

    server = ServerThread(app)
    server.start()
    log.info('Server started')

def stop_server():
    global server
    if server:
        server.shutdown()

# Main function to test server startup and shutdown
def main():
    start_server()
    input("Press Enter to stop the server...")
    stop_server()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
