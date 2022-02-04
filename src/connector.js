const connector = {
  _call_number: 0,
  _exposed_functions: {},
  _call_return_callbacks: {},

  expose: function (f, name) {
    if (name === undefined) {
      name = f.toString();
      let i = "function ".length,
        j = name.indexOf("(");
      name = name.substring(i, j).trim();
    }

    connector._exposed_functions[name] = f;
  },

  _import_py_function: function (name) {
    let func_name = name;
    connector[name] = function () {
      let call_object = connector._call_object(func_name, arguments);
      connector._websocket.send(connector._toJSON(call_object));
      return connector._call_return(call_object);
    };
  },

  _call_object: function (name, args) {
    let arg_array = [];
    for (let i = 0; i < args.length; i++) {
      arg_array.push(args[i]);
    }

    let call_id = (connector._call_number += 1) + Math.random();
    return { call: call_id, name: name, args: arg_array };
  },

  _toJSON: function (obj) {
    return JSON.stringify(obj, (k, v) => (v === undefined ? null : v));
  },

  _call_return: function (call) {
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

  _init: function () {
    document.addEventListener("DOMContentLoaded", function (event) {
      connector._websocket = new WebSocket("ws://localhost:4949/");

      connector._websocket.onopen = function () {
        connector._import_py_function("import_python_functions");
        connector.import_python_functions()((functions) => {
          for (let i = 0; i < functions.length; i++) {
            let py_function = functions[i];
            connector._import_py_function(py_function);
          }
        });
        console.log("Connected to Python backend");
      };

      connector._websocket.onmessage = function (e) {
        let message = JSON.parse(e.data);
        console.log(message);
        if (message.hasOwnProperty("call")) {
          // Python making a function call into us
          if (message.name in connector._exposed_functions) {
            try {
              let return_val = connector._exposed_functions[message.name](
                ...message.args
              );
              connector._websocket.send(
                connector._toJSON({
                  return: message.call,
                  status: "ok",
                  value: return_val,
                })
              );
            } catch (err) {
              debugger;
              connector._websocket.send(
                connector._toJSON({
                  return: message.call,
                  status: "error",
                  error: err.message,
                  stack: err.stack,
                })
              );
            }
          }
        } else if (message.hasOwnProperty("return")) {
          // Python returning a value to us
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
        } else {
          throw "Invalid message " + message;
        }
      };
    });
  },
};

connector._init();

if (typeof require !== "undefined") {
  // Avoid name collisions when using Electron, so jQuery etc work normally
  window.nodeRequire = require;
  delete window.require;
  delete window.exports;
  delete window.module;
}
