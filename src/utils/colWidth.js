function setStaticColWidth(worksheet, width = 20) {
  if (!worksheet) throw new Error('Лист не определён.')

  // Устанавливаем ширину для всех колонок
  const columnCount = worksheet.columnCount // Общее количество колонок
  for (let i = 1; i <= columnCount; i++) {
    worksheet.getColumn(i).width = width
  }
}

function setCustomColWidth(worksheet, columnWidths) {
  if (!worksheet) throw new Error('Лист не определён.')

  for (const [colIndex, width] of Object.entries(columnWidths)) {
    const column = worksheet.getColumn(parseInt(colIndex, 10))
    column.width = width
  }
}

module.exports = { setStaticColWidth, setCustomColWidth }
