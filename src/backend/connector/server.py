from .handler import connect_websocket, spawn, _javascript_call
from bottle.ext import websocket as bottle_websocket
import bottle

def start(port = 4949, block = True, quiet = True):
    def run_server():
        return bottle.run(
            port = port,
            quiet = quiet,
            host = "0.0.0.0",
            app = bottle.default_app(),
            server = bottle_websocket.GeventWebSocketServer,
        )

    if block:
        run_server()
    else:
        spawn(run_server)

bottle.route(
    path = '/', 
    callback = connect_websocket, 
    apply = (bottle_websocket.websocket,))
