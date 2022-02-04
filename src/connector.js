const connector = {
  _call_number: 0,
  _websocket: null,
  _exposed_functions: {},
  _call_return_callbacks: {},

  constructor: function (port = 4949) {
    document.addEventListener("DOMContentLoaded", () => {
      connector._websocket = new WebSocket(`ws://localhost:${port}/`);

      connector._websocket.onopen = connector._onOpen
      connector._websocket.onmessage = connector._onMessage;
    });
  },
  
  _callFunction: function(message) {
    if (message.name in connector._exposed_functions) {
      try {
        const return_val = connector._exposed_functions[message.name](
          ...message.args
        );
        connector._websocket.send(
          connector._toJSON({
            status: "ok",
            value: return_val,
            return: message.call,
          })
        );
      } catch (err) {
        debugger;
        connector._websocket.send(
          connector._toJSON({
            status: "error",
            stack: err.stack,
            error: err.message,
            return: message.call,
          })
        );
      }
    }
  },

  _returnFunction: function(message) {
    if (message["return"] in connector._call_return_callbacks) {
      if (message["status"] === "ok") {
        connector._call_return_callbacks[message["return"]].resolve(
          message.value
        );
      } else if (
        message["status"] === "error" &&
        connector._call_return_callbacks[message["return"]].reject
      ) {
        connector._call_return_callbacks[message["return"]].reject(
          message["error"]
        );
      }
    }
  },

  _onMessage: function(e) {
    let message = JSON.parse(e.data);
    if (message.hasOwnProperty("call")) {
      connector._callFunction(message);
    } else if (message.hasOwnProperty("return")) {
      connector._returnFunction(message);
    } else {
      throw "Invalid message " + message;
    }
  },

  expose: function(func, name) {
    if (name === undefined) {
      name = func.toString();
      const start = "function ".length, end = name.indexOf("(");
      name = name.substring(start, end).trim();
    }

    connector._exposed_functions[name] = func;
  },

  _toJSON: function(obj) {
    return JSON.stringify(obj, (k, v) => (v === undefined ? null : v));
  },

  _callObject: function(name, args) {
    const arg_array = [];
    for (let i = 0; i < args.length; i++) {
      arg_array.push(args[i]);
    }

    const call_id = (connector._call_number += 1) + Math.random();
    return { call: call_id, name: name, args: arg_array };
  },

  _callReturn: function(call) {
    return function (callback = null) {
      if (callback != null) {
        connector._call_return_callbacks[call.call] = { resolve: callback };
      } else {
        return new Promise(function (resolve, reject) {
          connector._call_return_callbacks[call.call] = {
            resolve: resolve,
            reject: reject,
          };
        });
      }
    };
  },

  _import_py_function: function(func_name) {
    connector[func_name] = function () {
      let call_object = connector._callObject(func_name, arguments);
      connector._websocket.send(connector._toJSON(call_object));
      return connector._callReturn(call_object);
    };
  },

  _onOpen: function() {
    connector._import_py_function("import_python_functions");
    connector.import_python_functions()((functions) => {
      for (let i = 0; i < functions.length; i++) {
        const py_function = functions[i];
        connector._import_py_function(py_function);
      }
    });
    console.log("Connected to Python backend");
  }
}

connector.constructor(4949);

if (typeof require !== "undefined") {
  // Avoid name collisions when using Electron, so jQuery etc work normally
  window.nodeRequire = require;
  delete window.require;
  delete window.exports;
  delete window.module;
}
