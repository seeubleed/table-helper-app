function removeColumns(worksheet) {
  const headerRow = worksheet.getRow(1).values.slice(1)

  const projectToValIndex = headerRow.indexOf('validators_task') + 1
  const validatorAnswerIndex = headerRow.indexOf('validation_project') + 1
  const assessorAnswerIndex = headerRow.indexOf('assesor_project') + 1
  const doubt = headerRow.indexOf('doubt') + 1

  const columnsToRemove = [validatorAnswerIndex, assessorAnswerIndex, projectToValIndex, doubt]

  // Удаляем столбцы, начиная с последнего, чтобы индексы не сдвигались
  columnsToRemove
    .sort((a, b) => b - a) // Сортируем в обратном порядке
    .forEach(columnIndex => {
      worksheet.spliceColumns(columnIndex, 1)
    })
}

module.exports = removeColumns
