const { DateTime } = require('luxon')

async function updateDates(worksheet, ...columns) {
  const formatDate = date => {
    if (!date) return date

    let parsedDate
    if (typeof date === 'string') {
      parsedDate = DateTime.fromISO(date)
    } else if (date instanceof Date) {
      parsedDate = DateTime.fromJSDate(date)
    } else {
      return date
    }

    if (!parsedDate.isValid) return date
    return parsedDate.toFormat('dd.MM.yyyy')
  }

  if (!columns.length) {
    console.warn('Колонки для обработки не указаны.')
    return
  }

  // Обновляем даты в колонках
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      // Пропускаем строку с заголовками
      columns.forEach(columnIndex => {
        const cell = row.getCell(columnIndex)
        if (cell.value) {
          cell.value = formatDate(cell.value)
        }
      })
    }
  })

  worksheet.eachRow(row => row.commit())
}

module.exports = updateDates
