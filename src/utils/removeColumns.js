const logger = require('../logger')

function removeColumns(worksheet) {
  const headerRow = worksheet.getRow(1).values.slice(1)

  const projectToValIndex = headerRow.indexOf('project_to_val') + 1
  const validatorAnswerIndex = headerRow.indexOf('validator_answer') + 1
  const assessorAnswerIndex = headerRow.indexOf('assessor_answer') + 1
  const valProjectdIndex = headerRow.indexOf('val_project') + 1
  const valTaskIdIndex = headerRow.indexOf('val_task_id') + 1
  const taskExtIdIndex = headerRow.indexOf('task_ext_id1') + 1

  const columnsToRemove = [validatorAnswerIndex, assessorAnswerIndex, projectToValIndex, valProjectdIndex, valTaskIdIndex, taskExtIdIndex]

  // Удаляем столбцы, начиная с последнего, чтобы индексы не сдвигались
  columnsToRemove
    .sort((a, b) => b - a) // Сортируем в обратном порядке
    .forEach(columnIndex => {
      worksheet.spliceColumns(columnIndex, 1)
    })

  logger.info(`Колонки ${columnsToRemove.join(', ')} успешно удалены.`)
}

module.exports = removeColumns
