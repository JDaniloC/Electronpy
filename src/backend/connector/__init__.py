from .exposer import expose, EXPOSED_FUNCTIONS
from .server import start, _javascript_call

@expose
def import_python_functions():
    return list(EXPOSED_FUNCTIONS.keys())

@expose
def export_javascript_functions(functions: list):
    for f in functions:
        exec('%s = lambda *args: _javascript_call("%s", args)' % (f, f), globals())