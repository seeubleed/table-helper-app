async function updateAnswers(worksheet) {
  const headerRow = worksheet.getRow(1) // Заголовок таблицы

  const headerRowF = worksheet.getRow(1).values.slice(1)
  const validatorAnswerIndex = headerRowF.indexOf('validator_answer') + 1
  const assessorAnswerIndex = headerRowF.indexOf('assessor_answer') + 1

  const existingHeaders = headerRow.values.slice(1).filter(header => header !== undefined)

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // Пропускаем заголовок

    const validatorAnswer = row.getCell(validatorAnswerIndex).value
    const assessorAnswer = row.getCell(assessorAnswerIndex).value

    // Обработка JSON для validator_answer
    if (validatorAnswer) {
      try {
        const parsedValidator = JSON.parse(validatorAnswer)
        for (const [key, value] of Object.entries(parsedValidator)) {
          const columnName = `validator_${key}`
          let columnIndex = existingHeaders.indexOf(columnName) + 1 // Индексы ExcelJS начинаются с 1

          // Если колонка отсутствует, добавляем её в заголовок
          if (columnIndex === 0) {
            existingHeaders.push(columnName)
            columnIndex = existingHeaders.length
            headerRow.getCell(columnIndex).value = columnName
          }

          // Устанавливаем значение в соответствующую ячейку
          row.getCell(columnIndex).value = Array.isArray(value) ? value.join(', ') : value
        }
      } catch (error) {
        console.warn(`Ошибка парсинга JSON в столбце validator_answer на строке ${rowNumber}`)
      }
    }

    // Обработка JSON для assessor_answer
    if (assessorAnswer) {
      try {
        const parsedAssessor = JSON.parse(assessorAnswer)
        for (const [key, value] of Object.entries(parsedAssessor)) {
          const columnName = `assessor_${key}`
          let columnIndex = existingHeaders.indexOf(columnName) + 1 // Индексы ExcelJS начинаются с 1

          // Если колонка отсутствует, добавляем её в заголовок
          if (columnIndex === 0) {
            existingHeaders.push(columnName)
            columnIndex = existingHeaders.length
            headerRow.getCell(columnIndex).value = columnName
          }

          // Устанавливаем значение в соответствующую ячейку
          row.getCell(columnIndex).value = Array.isArray(value) ? value.join(', ') : value
        }
      } catch (error) {
        console.warn(`Ошибка парсинга JSON в столбце assessor_answer на строке ${rowNumber}`)
      }
    }

    row.commit()
  })

  headerRow.commit()
}

module.exports = updateAnswers
