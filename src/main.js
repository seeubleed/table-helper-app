const { app, BrowserWindow, ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater')

const initialize = require('./windows/mainWindow')
const registerIpcHandlers = require('./ipcHandlers')

app.on('ready', () => {
  initialize()
  registerIpcHandlers()
})

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

//for macOS only
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    initialize()
  }
})

app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, url) => {
    if (!url.startsWith('https://your-allowed-url.com')) {
      event.preventDefault()
    }
  })
})
