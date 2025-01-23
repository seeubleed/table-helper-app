const { ipcMain, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')
const { loadJSON, saveJSON } = require('./utils/jsonHandler')
const handleSelectFile = require('./file/selectFile')
const handleSaveFile = require('./file/saveFile')
const core = require('./core')

const { version } = require('../package.json')

const settingsPath = path.join(process.cwd(), 'settings.json')
const colorsPath = path.join(process.cwd(), 'colors.json')
const optionsPath = path.join(process.cwd(), 'options.json')

const columnsFilePath = path.join(process.cwd(), 'columns.json')

const registerIpcHandlers = () => {
  ipcMain.handle('load-options', () => loadJSON(optionsPath))
  ipcMain.handle('save-options', (_, updatedOptions) => {
    saveJSON(optionsPath, updatedOptions)
    return 'success'
  })

  ipcMain.handle('load-settings', () => loadJSON(colorsPath)) // Загружаем JSON из файла
  // Обработчик для сохранения настроек
  ipcMain.handle('save-settings', (_, updatedSettings) => {
    saveJSON(colorsPath, updatedSettings)
    return 'success'
  })

  ipcMain.handle('load-checkbox-state', () => loadJSON(settingsPath))
  ipcMain.handle('save-checkbox-state', (_, state) => {
    saveJSON(settingsPath, state)
    return 'success'
  })

  ipcMain.handle('select-file', handleSelectFile)
  ipcMain.handle('save-file', async (_, tempFilePath) => {
    return handleSaveFile(tempFilePath)
  })
  ipcMain.handle('process-file', async (_, filePath, ext, options) => {
    try {
      const tempFilePath = await core(filePath, ext, options)
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

  // Загружаем сохранённые данные или создаём по умолчанию
  ipcMain.handle('load-columns', () => {
    if (fs.existsSync(columnsFilePath)) {
      return JSON.parse(fs.readFileSync(columnsFilePath, 'utf8'))
    }
    return Array.from({ length: 23 }, (_, i) => ({ name: `Column ${i + 1}`, visible: true }))
  })

  // Обработчик для обновления порядка колонок
  ipcMain.handle('update-columns-order', (event, updatedColumns) => {
    console.log('Получен новый порядок колонок:', updatedColumns)
    fs.writeFileSync(columnsFilePath, JSON.stringify(updatedColumns, null, 2))
    return true // Возврат успешного результата
  })

  // Обработчик для сохранения колонок
  ipcMain.handle('save-columns', (event, savedColumns) => {
    console.log('Сохраненные колонки:', savedColumns)
    fs.writeFileSync(columnsFilePath, JSON.stringify(savedColumns, null, 2))
    return true // Возврат успешного результата
  })
}

module.exports = registerIpcHandlers
