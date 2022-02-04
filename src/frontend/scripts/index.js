function callPythonFunction() {
    const paragraph = document.querySelector('p');
    connector.python_world()((result) => {
        paragraph.innerText = result;
    })
}