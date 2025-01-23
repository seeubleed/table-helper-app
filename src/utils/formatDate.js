const { DateTime } = require('luxon')
const global = require('../global')

async function updateDates(worksheet) {
  const headerRow = worksheet.getRow(1).values.slice(1)
  const asCreatedIndex = headerRow.indexOf(global.assessor_date) + 1
  const valCreatedIndex = headerRow.indexOf(global.validation_date) + 1

  if (asCreatedIndex === 0 || valCreatedIndex === 0) {
    console.warn('Одна или несколько колонок не найдены в заголовке.')
    return
  }

  const columns = [asCreatedIndex, valCreatedIndex]

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
