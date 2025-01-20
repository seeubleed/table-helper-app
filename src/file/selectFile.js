const { dialog } = require('electron')
const logger = require('../logger')
const path = require('path')

async function handleSelectFile() {
  try {
    logger.info('Выбор файла')
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Выберите файл Excel',
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'csv'] }],
      properties: ['openFile'],
    })

    if (canceled || filePaths.length === 0) {
      logger.info('Файл не был выбран')
      return { error: 'Файл не был выбран.' }
    }

    const filePath = filePaths[0] // Берём первый путь
    const ext = path.extname(filePath).toLowerCase()
    console.log(filePath)
    console.log(ext)

    switch (ext) {
      case '.xlsx':
      case '.csv':
        return { success: true, filePath, ext }
      default:
        throw new Error(`Unsupported file format: ${ext}`)
    }
  } catch (error) {
    logger.error('Ошибка при выборе файла:', error)
    return { error: error.message }
  }
}

module.exports = handleSelectFile
