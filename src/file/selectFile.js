const { dialog } = require('electron')
const logger = require('../logger')
const path = require('path')

async function handleSelectFile() {
  try {
    logger.info('Выбор файла')
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Выберите файл',
      filters: [{ name: 'Excel и CSV', extensions: ['xlsx', 'csv'] }],
      properties: ['openFile'],
    })

    if (canceled || filePaths.length === 0) {
      logger.info('Файл не был выбран')
      return { error: 'Файл не был выбран.' }
    }

    const filePath = filePaths[0]
    const ext = path.extname(filePath).toLowerCase()

    switch (ext) {
      case '.xlsx':
      case '.csv':
        return { success: true, filePath, ext }
      default:
        return { error: `Unsupported file format: ${ext}` }
    }
  } catch (error) {
    logger.error('Ошибка при выборе файла:', error)
    return { error: error.message }
  }
}

module.exports = handleSelectFile
