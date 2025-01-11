const logger = require('../logger')

async function moveColumnsToEnd(worksheet, columnNames) {
  if (!worksheet) throw new Error('sheet is not defined')

  const headerRow = worksheet.getRow(1) // Первая строка - заголовки
  const columnIndexes = []

  // Получение индексов столбцов
  columnNames.forEach(columnName => {
    const columnIndex = headerRow.values.findIndex(value => value === columnName)
    if (columnIndex === -1) {
      logger.info(`no columns found: "${columnName}"`)
    } else {
      columnIndexes.push(columnIndex)
    }
  })

  if (columnIndexes.length === 0) {
    logger.info('skipping')
    return
  }

  // Сортировка индексов в порядке убывания (чтобы корректно удалять столбцы)
  columnIndexes.sort((a, b) => b - a)

  // Сохраняем данные перемещаемых столбцов
  const columnDataMap = columnIndexes.map(index => {
    const columnData = []
    worksheet.eachRow(row => {
      columnData.push(row.getCell(index).value)
    })
    return columnData
  })

  // Удаляем исходные столбцы
  columnIndexes.forEach(index => worksheet.spliceColumns(index, 1))

  // Добавляем столбцы в конецs
  columnDataMap.forEach((columnData, idx) => {
    const newColumnIndex = worksheet.columnCount // Новый индекс столбца
    columnData.forEach((value, rowIndex) => {
      worksheet.getRow(rowIndex + 1).getCell(newColumnIndex).value = value
    })

    // Устанавливаем заголовок
    const columnName = columnNames[idx]
    worksheet.getRow(1).getCell(newColumnIndex).value = columnName
  })

  console.log('successfully moved to the end')
}

module.exports = moveColumnsToEnd
