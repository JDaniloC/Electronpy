function callPythonFunction() {
    const paragraph = document.querySelector('p');
    connector.python_world()((result) => {
        paragraph.innerText = result;
    })
}

connector.expose(javascriptWorld)
function javascriptWorld() {
    const message = "Hello from javascript world";
    console.log(message);
    return message
}

connector.expose(changeInnerText)
function changeInnerText(text) {
    console.log("Javascript world:", text);
    const paragraph = document.querySelector('p');
    paragraph.innerText = text;
}

function callJavascriptFunction() {
    connector.call_javascript_world()
}