const { ipcMain, BrowserWindow } = require('electron')
const path = require('path')
const { loadJSON, saveJSON } = require('./utils/jsonHandler')
const handleSelectFile = require('./utils/selectFile')
const handleSaveFile = require('./utils/saveFile')
const core = require('./core')

const { version } = require('../package.json')

const stateFilePath = path.join(process.cwd(), 'settings.json')
const optionsPath = path.join(process.cwd(), 'options.json')

const registerIpcHandlers = () => {
  ipcMain.handle('load-options', () => loadJSON(optionsPath))
  ipcMain.handle('save-options', (_, updatedOptions) => {
    saveJSON(optionsPath, updatedOptions)
    return 'success'
  })

  ipcMain.handle('load-checkbox-state', () => loadJSON(stateFilePath))
  ipcMain.handle('save-checkbox-state', (_, state) => {
    saveJSON(stateFilePath, state)
    return 'success'
  })

  ipcMain.handle('select-file', handleSelectFile)
  ipcMain.handle('save-file', async (_, tempFilePath) => {
    return handleSaveFile(tempFilePath)
  })
  ipcMain.handle('process-file', async (_, filePath, options) => {
    try {
      const tempFilePath = await core(filePath, options)
      return { success: true, tempFilePath }
    } catch (error) {
      return { error: error.message }
    }
  })

  ipcMain.on('window-minimize', _ => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) window.minimize()
  })

  ipcMain.on('window-close', _ => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) window.close()
  })

  ipcMain.handle('get-app-version', () => {
    return version
  })
}

module.exports = registerIpcHandlers
