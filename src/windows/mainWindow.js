const { BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const logger = require('../logger')

let mainWindow

function initialize() {
  try {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 550,
      frame: false,
      resizable: false,
      icon: path.join(`${__dirname}/../icons/icon.ico`),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(`${__dirname}/../preload.js`),
        enableRemoteModule: false,
      },
    })

    mainWindow.loadFile('src/html/index.html')

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      // Открываем все ссылки во внешнем браузере
      require('electron').shell.openExternal(url)
      return { action: 'deny' } // Запрещаем открытие внутри приложения
    })

    logger.info('Главное окно загружено')
  } catch (e) {
    logger.error(`Ошибка при создании окна: ${e.message}`)
  }
}

function getMainWindow() {
  return mainWindow
}

module.exports = { initialize, getMainWindow }
