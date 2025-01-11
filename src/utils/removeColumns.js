const logger = require('../logger')

function removeColumns(worksheet, validatorAnswerIndex, assessorAnswerIndex, projectToValIndex, valProjectdIndex, valTaskIdIndex, taskExtIdIndex) {
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
