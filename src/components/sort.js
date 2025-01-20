async function sortByDate(worksheet) {
  const headerRow = worksheet.getRow(1).values.slice(1)
  const asCreatedIndex = headerRow.indexOf('as_created') + 1

  if (!worksheet) throw new Error('sheet is not defined')
  if (asCreatedIndex === -1) throw new Error(`no columns found: "${asCreatedIndex}"`)

  // Читаем все строки, пропуская заголовок
  const rows = []
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const rowData = row.values.slice(1) // Пропускаем пустую первую ячейку
      rows.push(rowData)
    }
  })

  // Сортируем строки по возрастанию дат
  rows.sort((a, b) => {
    const dateA = new Date(a[asCreatedIndex - 1]?.replace(/\./g, '-'))
    const dateB = new Date(b[asCreatedIndex - 1]?.replace(/\./g, '-'))

    if (isNaN(dateA) && isNaN(dateB)) return 0
    if (isNaN(dateA)) return 1
    if (isNaN(dateB)) return -1
    return dateA - dateB
  })

  const rowsToDelete = []
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) rowsToDelete.push(rowNumber)
  })

  // Удаляем строки, начиная с последней
  rowsToDelete.reverse().forEach(rowNumber => {
    worksheet.spliceRows(rowNumber, 1)
  })

  rows.forEach(rowData => {
    worksheet.addRow(rowData)
  })

  worksheet.eachRow(row => row.commit()) // Применяем изменения
}

module.exports = sortByDate
