EXPOSED_FUNCTIONS = {}

def verify_and_expose(name, function):
    """
    Verifies if the function already was exposed,
    if not, it will be exposed
    """
    msg = f'Already exposed function with name "{name}"'
    assert name not in EXPOSED_FUNCTIONS, msg
    EXPOSED_FUNCTIONS[name] = function

def expose(name_or_function=None):
    """
    Exposes a function to the frontend, can be used:
    @connector.expose() or @connector.expose('name')
    """
    if name_or_function is None:
        return expose

    if type(name_or_function) == str:
        name = name_or_function

        def decorator(function):
            verify_and_expose(name, function)
            return function
        return decorator
    else:
        function = name_or_function
        verify_and_expose(function.__name__, function)
        return function
