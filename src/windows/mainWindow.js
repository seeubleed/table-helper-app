const { BrowserWindow, ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const logger = require('../logger')

let mainWindow

function Initialize() {
  try {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 300,
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

    logger.info('Проверка обновлений...')
    autoUpdater.checkForUpdatesAndNotify()

    // Обработчики событий автообновлений
    autoUpdater.on('checking-for-update', () => {
      logger.info('Проверка наличия обновлений...')
    })

    autoUpdater.on('update-available', info => {
      logger.info(`Доступно обновление: версия ${info.version}`)
      mainWindow.webContents.send('update_available')
    })

    autoUpdater.on('update-not-available', info => {
      logger.info('Обновлений нет.')
    })

    autoUpdater.on('error', err => {
      logger.error(`Ошибка автообновления: ${err}`)
    })

    autoUpdater.on('download-progress', progressObj => {
      logger.info(`Скорость загрузки: ${progressObj.bytesPerSecond} - Загружено ${progressObj.percent.toFixed(2)}% (${progressObj.transferred}/${progressObj.total})`)
    })

    autoUpdater.on('update-downloaded', () => {
      logger.info('Обновление загружено.')
      mainWindow.webContents.send('update_downloaded')
    })

    ipcMain.on('resize-window', (_, height) => {
      const [currentWidth] = mainWindow.getSize()
      mainWindow.setBounds({
        x: mainWindow.getBounds().x,
        y: mainWindow.getBounds().y,
        width: currentWidth,
        height: Math.max(height, 300), // Установка минимальной высоты
      })
    })

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
