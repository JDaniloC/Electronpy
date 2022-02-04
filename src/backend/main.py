import connector

@connector.expose
def python_world():
    result = "Hello from python world"
    print(result)
    return result

connector.start(quiet = False)