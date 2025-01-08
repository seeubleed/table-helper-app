const fs = require('fs')
const path = require('path')

function loadRenameMap(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(fileContent)
  } catch (error) {
    console.error('Ошибка при загрузке файла renameMap:', error.message)
    return null
  }
}

function renameColumns(worksheet, renameMap) {
  if (!renameMap) {
    console.error('Карта переименований не загружена.')
    return
  }

  const headerRow = worksheet.getRow(1)
  headerRow.eachCell(cell => {
    const originalName = cell.value
    if (renameMap[originalName]) {
      cell.value = renameMap[originalName]
    }
  })

  console.log('Столбцы переименованы.')
}

module.exports = { loadRenameMap, renameColumns }
