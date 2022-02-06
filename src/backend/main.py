import connector

@connector.expose
def python_world():
    result = "Hello from python world"
    print(result)
    return result

def call_javascript_world_callback(message: str):
    print("Python World:", message)
    connector.changeInnerText(message)

@connector.expose
def call_javascript_world():
    connector.javascriptWorld()(
        call_javascript_world_callback)

connector.start(quiet = False)