const { app, BrowserWindow } = require('electron');
const { config: startEnv } = require("dotenv");
const { URL } = require("url");
const path = require('path');

startEnv();

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
    
    if (process.env.DEV_TOOLS) {
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
