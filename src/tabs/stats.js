const { setFontSize, setHeaderHeight } = require('../utils/fontSize')
const { DateTime } = require('luxon')
const logger = require('../logger')

async function setStats(sourceWorksheet) {
  if (!sourceWorksheet) throw new Error('Лист не определён.')

  // Создаём новый лист
  const statsWorksheet = sourceWorksheet.workbook.addWorksheet('состав')

  // Добавляем заголовки
  statsWorksheet.addRow([
    'Месяц',
    'Неделя',
    '№ п/п',
    'Имя и Фамилия исполнителя',
    'Количество верных ответов',
    'Количество ошибок',
    'Количество спорных кейсов',
    'Итого',
    'Процент ошибок',
    'Влияние',
  ])

  // Инициализируем данные
  const headerRow = sourceWorksheet.getRow(1)
  const asessorIndex = headerRow.values.findIndex(value => value === 'asessor::multi-filter')
  const correctIndex = headerRow.values.findIndex(value => value === 'correct')
  const asCreatedIndex = headerRow.values.findIndex(value => value === 'as_created')

  if (asessorIndex === -1 || correctIndex === -1 || asCreatedIndex === -1) {
    logger.error(
      'Вкладка статистики. asessorIndex, correctIndex, asCreatedIndex не найдены, пропуск.'
    )
    return
  }

  const stats = {}
  let totalTasks = 0
  let totalErrors = 0
  let totalDisputed = 0

  // Считаем задачи и ошибки
  sourceWorksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // Пропускаем заголовок

    const asessor = row.getCell(asessorIndex).value?.toString().trim()
    const correct = row.getCell(correctIndex).value?.toString().trim()
    const asCreated = row.getCell(asCreatedIndex).value?.toString().trim()

    if (!asessor || !correct || !asCreated) return

    // Парсим дату
    const parsedDate = DateTime.fromISO(asCreated)
    const month = parsedDate.isValid
      ? parsedDate
          .setLocale('ru')
          .toFormat('LLLL')
          .replace(/^./, char => char.toUpperCase())
      : 'Не определено'
    const weekNumber = parsedDate.isValid ? `W${parsedDate.weekNumber}` : 'Не определено'

    if (!stats[asessor]) {
      stats[asessor] = { correct: 0, errors: 0, disputed: 0, total: 0, month, weekNumber }
    }

    stats[asessor].total += 1

    if (correct === 'Да') {
      stats[asessor].correct += 1
    } else if (correct === 'Нет') {
      stats[asessor].errors += 1
    } else if (correct === 'Спорно') {
      stats[asessor].disputed += 1
    }
  })

  // Считаем общую сумму ошибок
  totalErrors = Object.values(stats).reduce((sum, { errors }) => sum + errors, 0)

  // Добавляем данные в новый лист
  let counter = 1
  for (const [asessor, { correct, errors, disputed, total, month, weekNumber }] of Object.entries(
    stats
  )) {
    const errorPercentage = total > 0 ? ((errors / total) * 100).toFixed(2) : '0.00'
    const influence = totalErrors > 0 ? ((errors / totalErrors) * 100).toFixed(2) : '0.00'

    statsWorksheet.addRow([
      month,
      weekNumber,
      counter,
      asessor,
      correct,
      errors,
      disputed,
      total,
      `${errorPercentage}%`,
      `${influence}%`,
    ])

    totalTasks += total
    totalDisputed += disputed
    counter++
  }

  statsWorksheet.addRow([]) // Пустая строка
  statsWorksheet.addRow([]) // Пустая строка
  // Добавляем итоговую строку
  const overallErrorPercentage = ((totalErrors / totalTasks) * 100).toFixed(2)

  statsWorksheet.addRow([
    '',
    '',
    '',
    'Итого',
    totalTasks - totalErrors - totalDisputed, // Общие верные ответы
    totalErrors,
    totalDisputed,
    totalTasks,
    `${overallErrorPercentage}%`,
    '100.00%', // Влияние всех ошибок
  ])

  // Настраиваем ширину столбцов
  statsWorksheet.columns = [
    { width: 20 }, // № п/п
    { width: 20 }, // Месяц
    { width: 20 }, // Номер недели
    { width: 30 }, // Асессор
    { width: 25 }, // Количество верных ответов
    { width: 25 }, // Количество ошибок
    { width: 25 }, // Количество спорных кейсов
    { width: 25 }, // Итого
    { width: 25, style: { numFmt: '0.00%' } }, // Процент ошибок
    { width: 25, style: { numFmt: '0.00%' } }, // Влияние
  ]

  // Выравнивание всех столбцов по центру и вертикальное выравнивание
  statsWorksheet.columns.forEach(column => {
    column.alignment = { vertical: 'middle', horizontal: 'center' }
  })

  setFontSize(statsWorksheet, 10, true)
  setHeaderHeight(statsWorksheet, 30)

  // Выравниваем заголовки по центру
  statsWorksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }

  console.log('Статистика ассессоров успешно создана.')
}

module.exports = setStats
