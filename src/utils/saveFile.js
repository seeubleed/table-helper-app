const { dialog } = require('electron')
const fs = require('fs')
const logger = require('../logger')

async function handleSaveFile(event, tempFilePath) {
  const now = new Date()
  const timeString = now.toLocaleString('ru-RU', { hour12: false }).replace(/[^0-9]/g, ' ')
  try {
    logger.info('trying to save')
    const { filePath: savePath } = await dialog.showSaveDialog({
      title: 'Сохранить файл как',
      defaultPath: `table_${timeString}.xlsx`,
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
    })

    if (!savePath) {
      logger.info('Сохранение было отменено пользователем.')
      if (tempFilePath) fs.unlinkSync(tempFilePath)
      return { error: 'Сохранение было отменено пользователем.' }
    }

    if (!tempFilePath) {
      logger.error('Сохранения не существует.')
      return { error: 'Сохранения не существует.' }
    }

    fs.copyFileSync(tempFilePath, savePath) // Копируем временный файл в указанное место
    fs.unlinkSync(tempFilePath) // Удаляем временный файл

    logger.info(`Файл успешно обработан и сохранён в ${savePath}`)

    return {
      message: `Файл успешно обработан и сохранён в ${savePath}`,
    }
  } catch (error) {
    logger.error('Ошибка сохранения файла:', error)
    return { error: error.message }
  }
}

module.exports = handleSaveFile
