async function rearrangeColumns(worksheet, columnsData) {
  // Извлекаем только видимые колонки
  const visibleColumns = columnsData.filter(col => col.visible).map(col => col.name)

  const originalHeaders = worksheet.getRow(1).values.slice(1) // Извлекаем текущие заголовки (с индексом сдвига)
  const newData = []

  // Формируем строки в новом порядке
  worksheet.eachRow((row, rowIndex) => {
    if (rowIndex === 1) {
      // Заголовки
      newData.push(visibleColumns.map(colName => colName || ''))
    } else {
      // Остальные строки
      newData.push(
        visibleColumns.map(colName => {
          const columnIndex = originalHeaders.indexOf(colName) + 1
          return columnIndex > 0 ? row.getCell(columnIndex).value : null
        })
      )
    }
  })

  // Очищаем старый лист
  while (worksheet.rowCount > 0) {
    worksheet.spliceRows(1, 1)
  }

  // Перезаписываем строки с новым порядком
  newData.forEach((row, index) => {
    worksheet.insertRow(index + 1, row)
  })

  // Фиксируем изменения
  worksheet.eachRow(row => row.commit())
}

module.exports = rearrangeColumns
