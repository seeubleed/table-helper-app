const { app, BrowserWindow, ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater')

const fs = require('fs')
const path = require('path')

const logger = require('./logger')
const initialize = require('./windows/mainWindow')
const handleSelectFile = require('./utils/selectFile')
const core = require('./core')
const handleSaveFile = require('./utils/saveFile')

const stateFilePath = path.join(process.cwd(), 'settings.json')

ipcMain.handle('load-options', async () => {
  const optionsPath = path.join(process.cwd(), 'options.json')
  const data = fs.readFileSync(optionsPath, 'utf8')
  return JSON.parse(data)
})

ipcMain.handle('save-options', async (_, updatedOptions) => {
  const optionsPath = path.join(process.cwd(), 'options.json')
  fs.writeFileSync(optionsPath, JSON.stringify(updatedOptions, null, 2), 'utf8')
  return 'success'
})

ipcMain.handle('save-checkbox-state', async (_, state) => {
  try {
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf-8')
    return { success: true }
  } catch (error) {
    console.error('Ошибка сохранения состояния чекбоксов:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('load-checkbox-state', async () => {
  try {
    if (fs.existsSync(stateFilePath)) {
      const data = fs.readFileSync(stateFilePath, 'utf-8')
      return JSON.parse(data)
    }
    return {}
  } catch (error) {
    console.error('Ошибка загрузки состояния чекбоксов:', error)
    return {}
  }
})

app.on('ready', () => {
  initialize()
})

ipcMain.on('restart_app', () => {
  logger.info('Перезапуск приложения для установки обновления.')
  autoUpdater.quitAndInstall()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    Initialize()
  }
})

ipcMain.on('window-minimize', event => {
  const window = BrowserWindow.getFocusedWindow()
  if (window) window.minimize()
})

ipcMain.on('window-close', event => {
  const window = BrowserWindow.getFocusedWindow()
  logger.info('Приложение завершено')
  if (window) window.close()
})

ipcMain.handle('select-file', handleSelectFile)

ipcMain.handle('process-file', async (_, filePath, options) => {
  try {
    const tempFilePath = await core(filePath, options)
    return { success: true, tempFilePath }
  } catch (error) {
    logger.error(`Error in process-file: ${error.message}`)
    return { error: error.message }
  }
})

ipcMain.handle('save-file', async (_, tempFilePath) => {
  return await handleSaveFile(tempFilePath)
})
