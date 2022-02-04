const { app, BrowserWindow } = require('electron');
const childProcess = require('child_process');
const fileSystem = require("fs");
const { URL } = require("url");
const path = require('path');

const { 
    devToolsEnabled, pyDistFolder, 
    pyFolder, pyModule, pyPort, pyBin
} = require("./config");

/*************************************************************
 * py process
 *************************************************************/

 let pyProc = null
 
function guessPackaged() {
    const fullPath = path.join(__dirname, pyDistFolder)
    return fileSystem.existsSync(fullPath)
}
 
function getScriptPath() {
    if (!guessPackaged()) {
        return path.join(__dirname, pyFolder, pyModule + '.py')
    }
    if (process.platform === 'win32') {
        return path.join(__dirname, pyDistFolder, pyModule, pyModule + '.exe')
    }
    return path.join(__dirname, pyDistFolder, pyModule, pyModule)
}
 
const createPyProc = () => {
    const script = getScriptPath()
    
    if (guessPackaged()) {
        pyProc = childProcess.execFile(script, [pyPort],
            (error, stdout, stderr) => {
                if (error) {
                    throw error;
                }
                console.log(stdout);
        })
    } else {
        pyProc = childProcess.spawn(pyBin, [script, pyPort], {
            "stdio": ['ignore', process.stdout, process.stderr]
        })
    }
    
    if (pyProc != null) {
        console.log('child process success on port ' + pyPort)
    }
}
    
const exitPyProc = () => {
    pyProc.kill()
    pyProc = null
}

app.on('ready', createPyProc)
app.on('will-quit', exitPyProc) 

/*************************************************************
 * window management
 *************************************************************/

let mainWindow = null

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800, height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
    const indexPath = new URL(path.join(
        'file://', __dirname, 'index.html'
    ));
    mainWindow.loadURL(indexPath.href)
    
    if (devToolsEnabled) {
        mainWindow.webContents.openDevTools()
    }

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow()
    }
})
