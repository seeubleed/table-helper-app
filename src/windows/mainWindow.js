const { BrowserWindow } = require('electron')
const path = require('path')
const logger = require('../logger')

let mainWindow

function Initialize() {
  try {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 530,
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

module.exports = { Initialize, getMainWindow }
