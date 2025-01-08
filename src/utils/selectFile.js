const { dialog } = require('electron')
const logger = require('../logger')

async function handleSelectFile() {
  try {
    logger.info('Выбор файла')
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Выберите файл Excel',
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
      properties: ['openFile'],
    })

    if (canceled || filePaths.length === 0) {
      logger.info('Файл не был выбран')
      return { error: 'Файл не был выбран.' }
    }

    const filePath = filePaths[0] // Берём первый путь
    logger.info(`Выбранный файл: ${filePath}`)

    return { success: true, filePath } // Возвращаем путь
  } catch (error) {
    logger.error('Ошибка при выборе файла:', error)
    return { error: error.message }
  }
}

module.exports = handleSelectFile
