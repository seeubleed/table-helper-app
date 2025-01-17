const { setFontSize, setHeaderHeight } = require('../utils/fontSize')
const logger = require('../logger')

async function processWorksheet(worksheet) {
  if (!worksheet) {
    throw new Error('Лист не определен.')
  }

  const headerRow = worksheet.getRow(1)
  const asTaskIdIndex = headerRow.values.findIndex(value => value === 'as_task_id')
  const asCreatedIndex = headerRow.values.findIndex(value => value === 'as_created')
  const asessorIndex = headerRow.values.findIndex(value => value === 'asessor::multi-filter')
  const correctIndex = headerRow.values.findIndex(value => value === 'correct')

  const validatorColumns = {
    availability: headerRow.values.findIndex(
      value => value === 'validator_availability_answer_check'
    ),
    price: headerRow.values.findIndex(value => value === 'validator_correct_price_check'),
    quality: headerRow.values.findIndex(value => value === 'validator_quality_answer_check'),
    answer: headerRow.values.findIndex(value => value === 'validator_answer001_check'),
  }

  const assessorColumns = {
    availability: headerRow.values.findIndex(
      value => value === 'assessor_availability_answer_check'
    ),
    price: headerRow.values.findIndex(value => value === 'assessor_correct_price_check'),
    quality: headerRow.values.findIndex(value => value === 'assessor_quality_answer_check'),
    answer: headerRow.values.findIndex(value => value === 'assessor_answer001_check'),
  }

  if (asTaskIdIndex === -1 || asCreatedIndex === -1 || asessorIndex === -1 || correctIndex === -1) {
    logger.error(
      'Вкладка ошибок. asTaskIdIndex, asCreatedIndex, asessorIndex, correctIndex не найдено, пропуск.'
    )
    return
  }

  // Фильтрация отсутствующих столбцов
  const activeValidatorColumns = Object.entries(validatorColumns).filter(
    ([, index]) => index !== -1
  )
  const activeAssessorColumns = Object.entries(assessorColumns).filter(([, index]) => index !== -1)

  const translations = {
    availability: 'Наличие',
    price: 'Цена',
    quality: 'Описание',
    answer: 'Ответ',
  }

  // Создаем карту задач
  const taskMap = new Map()

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // Пропускаем заголовок

    const taskIdCell = row.getCell(asTaskIdIndex)
    const taskId =
      taskIdCell.hyperlink || (taskIdCell.value ? taskIdCell.value.toString().trim() : '')
    const taskIdClean = row.getCell(asTaskIdIndex).value?.toString().trim()
    const asCreated = row.getCell(asCreatedIndex).value // Дата создания
    const asessor = row.getCell(asessorIndex).value?.toString().trim()
    const correct = row.getCell(correctIndex).value?.toString().trim()

    if (!taskId || !asessor || !correct || !asCreated) return

    if (!taskMap.has(taskId)) {
      taskMap.set(taskId, { createdDate: asCreated, correct: [], incorrect: [] })
    }

    const taskEntry = taskMap.get(taskId)

    if (correct === 'Да') {
      taskEntry.correct.push(asessor)
    } else if (correct === 'Нет') {
      // Сравнение только активных колонок
      activeAssessorColumns.forEach(([key, index]) => {
        const assessorValue = row.getCell(index).value
        const validatorValue = row.getCell(validatorColumns[key]).value

        if (validatorValue !== undefined && assessorValue !== validatorValue) {
          const translatedKey = translations[key] || key
          if (!taskEntry.incorrect[asessor]) {
            taskEntry.incorrect[asessor] = []
          }
          taskEntry.incorrect[asessor].push(translatedKey)
        }
      })
    }
  })

  //   Создаем новый лист и заполняем его
  const newWorksheet = worksheet.workbook.addWorksheet('ошибки')
  newWorksheet.addRow(['Ссылка на задачу', 'Date', 'Верно', 'Ошибка'])

  taskMap.forEach((entry, taskId) => {
    if (Object.keys(entry.incorrect).length > 0) {
      const incorrectDetails = Object.entries(entry.incorrect)
        .map(([asessor, errors]) => `${asessor}: ${errors.join(', ')}`)
        .join('\n')

      newWorksheet.addRow([
        { text: taskId, hyperlink: taskId },
        entry.createdDate,
        entry.correct.length > 0 ? entry.correct.join('\n') : '',
        incorrectDetails,
      ])
    }
  })

  setFontSize(newWorksheet, 10, true)
  setHeaderHeight(newWorksheet, 30)
  setCustomColumnWidth(newWorksheet, { 1: 40, 2: 20, 3: 30, 4: 40 })
  setAlignment(newWorksheet)

  console.log('Обработка завершена. Новый лист с результатами создан.')
}

function setCustomColumnWidth(worksheet, columnWidths) {
  if (!worksheet) throw new Error('Лист не определён.')

  // columnWidths — объект вида { 1: 20, 2: 20, 3: 45, 4: 45 }
  for (const [colIndex, width] of Object.entries(columnWidths)) {
    const column = worksheet.getColumn(parseInt(colIndex, 10))
    column.width = width
  }
}

function setAlignment(worksheet) {
  if (!worksheet) throw new Error('Лист не определён.')

  // Выравнивание заголовков (первая строка) по центру
  const headerRow = worksheet.getRow(1)
  headerRow.eachCell(cell => {
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true, // Если текст длинный, включаем перенос
    }
  })

  // Настройка для содержимого
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      // Пропускаем заголовок
      row.eachCell((cell, colNumber) => {
        if (colNumber === 1) {
          // Для 1 и 2 колонок: содержимое выровнено по левому краю, текст по центру
          cell.alignment = {
            horizontal: 'right',
            vertical: 'middle',
          }
        } else {
          // Для остальных колонок: содержимое по центру
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true,
          }
        }
      })
    }
  })
}

module.exports = processWorksheet
