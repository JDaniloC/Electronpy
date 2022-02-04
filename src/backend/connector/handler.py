import json, random, time, traceback, gevent
from .exposer import EXPOSED_FUNCTIONS

def _safe_json(obj):
    return json.dumps(obj, default=lambda o: None)

class WebsocketClient:
    _call_return_callbacks = {}
    _call_return_values = {}
    websocket = None
    call_id = 0

    def _repeated_send(self, message):
        for _ in range(100):
            try:
                self.websocket.send(message)
                break
            except Exception:
                time.sleep(0.001)

    def _call_object(self, name: str, args: list):
        self.call_id += 1
        callback_id = self.call_id + random.random()
        return { 
            "call": callback_id, 
            "name": name, 
            "args": args
        }

    def _call_return(self, call):
        call_id = call['call']

        def return_func(callback = None, error_callback = None):
            if callback is not None:
                self._call_return_callbacks[call_id] = (callback, error_callback)
            else:
                for _ in range(10000):
                    if call_id in self._call_return_values:
                        result = self._call_return_values[call_id]
                        del self._call_return_values[call_id]
                        return result
                    time.sleep(0.001)
        return return_func

    def call_function(self, message: dict):
        error_info = {}
        try:
            function_name = message["name"]
            function_args = message["args"]
            return_value = EXPOSED_FUNCTIONS[function_name](*function_args)
            status = 'ok'

        except Exception as e:
            err_traceback = traceback.format_exc()
            traceback.print_exc()
            return_value = None
            status = 'error'
            error_info = {
                "errorText": repr(e),
                "errorTraceback": err_traceback
            }

        finally:
            self._repeated_send(_safe_json({
                "return": message["call"],
                "status": status,
                "value": return_value,
                "error": error_info
            })) 

    def receive_return(self, message: dict):
        call_id = message["return"]
        if call_id in self._call_return_callbacks:
            callback, error_callback = self._call_return_callbacks[call_id]
            if message["status"] == "ok":
                callback(message["value"])
            elif message["status"] == "error" and error_callback is not None:
                error_callback(message["error"], message["stack"])
            elif error_callback is None:
                print("Error:", message["error"], message["stack"])
            del self._call_return_callbacks[call_id]
        else:
            self._call_return_values[call_id] = message("value", None)

    def on_message(self, message):
        """Method to process websocket messages."""
        message = json.loads(str(message))
        if "call" in message:
            self.call_function(message)
        elif "return" in message and message["status"] == "ok":
            self.receive_return(message)
        else:
            print("Invalid message received:", message)

def spawn(function, *args, **kwargs):
    return gevent.spawn(function, *args, **kwargs)

def _javascript_call(name: str, args: list):
    call_object = websocket_client._call_object(name, args)
    dumped_args = _safe_json(call_object)
    websocket_client._repeated_send(dumped_args)
    return websocket_client._call_return(call_object)

def connect_websocket(new_websocket):
    websocket_client.websocket = new_websocket

    print("Websocket client connected.")
    while True:
        message = new_websocket.receive()
        if message is not None:
            spawn(websocket_client.on_message, new_websocket, message)
        else: break
    print("Websocket client disconnected.")

websocket_client = WebsocketClient()