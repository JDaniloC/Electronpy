import connector

@connector.expose
def python_world():
    print("Hello from python world")

connector.start(quiet = False)