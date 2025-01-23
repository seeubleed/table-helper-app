const { setFontSize, setHeaderHeight } = require('../utils/fontSize')
const { DateTime } = require('luxon')
const logger = require('../logger')

async function errorRate(sourceWorksheet) {
  if (!sourceWorksheet) throw new Error('Лист не определён.')

  const ErWorksheet = sourceWorksheet.workbook.addWorksheet('Состав')

  // Добавляем заголовки
  ErWorksheet.addRow(['Месяц', 'Неделя', '№ п/п', 'Имя и Фамилия исполнителя', 'Количество верных ответов', 'Количество ошибок', 'Количество спорных кейсов', 'Итого', 'Процент ошибок', 'Влияние'])

  // Инициализируем данные
  const headerRow = sourceWorksheet.getRow(1)
  const columnIndices = {
    asessor: headerRow.values.indexOf('asessor::multi-filter'),
    correct: headerRow.values.indexOf('correct'),
    asCreated: headerRow.values.indexOf('as_created'),
  }

  if (Object.values(columnIndices).some(index => index === -1)) {
    logger.error('Не найдены все необходимые данные в исходном листе.')
    return
  }

  const stats = {}
  let totalTasks = 0
  let totalErrors = 0
  let totalDisputed = 0

  const parseDate = dateStr => {
    const date = DateTime.fromISO(dateStr)
    return date.isValid
      ? {
          month: date
            .setLocale('ru')
            .toFormat('LLLL')
            .replace(/^./, char => char.toUpperCase()),
          weekNumber: `W${date.weekNumber}`,
        }
      : { month: 'Не определено', weekNumber: 'Не определено' }
  }

  // Считаем задачи и ошибки
  sourceWorksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // Пропускаем заголовок

    const asessor = row.getCell(columnIndices.asessor).value?.toString().trim()
    const correct = row.getCell(columnIndices.correct).value?.toString().trim()
    const asCreated = row.getCell(columnIndices.asCreated).value?.toString().trim()

    if (!asessor || !correct || !asCreated) return

    const { month, weekNumber } = parseDate(asCreated)

    if (!stats[asessor]) {
      stats[asessor] = { correct: 0, errors: 0, disputed: 0, total: 0, month, weekNumber }
    }

    if (!stats[asessor]) {
      stats[asessor] = { correct: 0, errors: 0, disputed: 0, total: 0, month, weekNumber }
    }
    stats[asessor].total++

    if (correct === 'Да') stats[asessor].correct++
    else if (correct === 'Нет') stats[asessor].errors++
    else if (correct === 'Спорно') stats[asessor].disputed++
  })

  // Считаем общую сумму ошибок
  totalErrors = Object.values(stats).reduce((sum, { errors }) => sum + errors, 0)

  // Добавляем данные в новый лист
  let counter = 1
  for (const [asessor, { correct, errors, disputed, total, month, weekNumber }] of Object.entries(stats)) {
    const errorPercentage = total > 0 ? ((errors / total) * 100).toFixed(2) : '0.00'
    const influence = totalErrors > 0 ? ((errors / totalErrors) * 100).toFixed(2) : '0.00'

    ErWorksheet.addRow([month, weekNumber, counter++, asessor, correct, errors, disputed, total, `${errorPercentage}%`, `${influence}%`])

    totalTasks += total
    totalDisputed += disputed
  }

  // Добавляем итоговую строку
  ErWorksheet.addRow([])
  ErWorksheet.addRow([])
  ErWorksheet.addRow(['', '', '', 'Итого', totalTasks - totalErrors - totalDisputed, totalErrors, totalDisputed, totalTasks, `${((totalErrors / totalTasks) * 100).toFixed(2)}%`, '100.00%'])

  // Настраиваем ширину столбцов
  ErWorksheet.columns = [
    { header: 'Месяц', width: 20 },
    { header: 'Неделя', width: 20 },
    { header: '№ п/п', width: 20 },
    { header: 'Имя и Фамилия исполнителя', width: 30 },
    { header: 'Количество верных ответов', width: 25 },
    { header: 'Количество ошибок', width: 25 },
    { header: 'Количество спорных кейсов', width: 25 },
    { header: 'Итого', width: 25 },
    { header: 'Процент ошибок', width: 25, style: { numFmt: '0.00%' } },
    { header: 'Влияние', width: 25, style: { numFmt: '0.00%' } },
  ].map(col => ({ ...col, alignment: { vertical: 'middle', horizontal: 'center' } }))

  // Выравнивание всех столбцов по центру и вертикальное выравнивание
  ErWorksheet.columns.forEach(column => {
    column.alignment = { vertical: 'middle', horizontal: 'center' }
  })

  setFontSize(ErWorksheet, 10, true)
  setHeaderHeight(ErWorksheet, 30)

  // Выравниваем заголовки по центру
  ErWorksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }

  console.log('Статистика ассессоров успешно создана.')
}

module.exports = errorRate
