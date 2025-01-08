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

  // columnWidths — объект вида { 1: 20, 2: 20, 3: 45, 4: 45 }
  for (const [colIndex, width] of Object.entries(columnWidths)) {
    const column = worksheet.getColumn(parseInt(colIndex, 10))
    column.width = width
  }
}

module.exports = { setStaticColWidth, setCustomColWidth }
