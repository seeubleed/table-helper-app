const path = require('path')
const settingsPath = path.join(process.cwd(), 'colors.json')
const { loadJSON, saveJSON } = require('../utils/jsonHandler')

async function highlightDuplicates(worksheet) {
  if (!worksheet) throw new Error('Лист не определён.')

  const headerRow = worksheet.getRow(1)
  const taskIdIndex = headerRow.values.findIndex(value => value === 'as_task_id')
  const createdIndex = headerRow.values.findIndex(value => value === 'asessor::multi-filter')

  if (taskIdIndex === -1 || createdIndex === -1) {
    console.log('Один из указанных столбцов не найден.')
    return
  }

  const DUPLICATE_COLORS = [
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDEEAF6' } }, // Светло-голубой
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F0DE' } }, // Светло-зеленый
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDEADA' } }, // Светло-бежевый
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3EED9' } }, // Кремовый
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E5F3' } }, // Лавандовый
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDEDED' } }, // Светло-серый
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF6DE' } }, // Светло-салатовый
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6DEE5' } }, // Светло-розовый
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF3F6' } }, // Пастельный голубой
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEE5F3' } }, // Светло-фиолетовый
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F2E6' } }, // Нежно-желтый
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDFE7EA' } }, // Серо-голубой
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDEBDF' } }, // Серо-бежевый
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F3F3' } }, // Светло-аквамариновый
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF7E8' } }, // Светло-персиковый
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7EDF2' } }, // Светло-розово-лиловый
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF7F1' } }, // Светло-бирюзовый
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAF4EA' } }, // Светло-абрикосовый
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFDF' } }, // Светло-песочный
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6F3E9' } }, // Мягкий светло-кремовый
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9EAEF' } }, // Бледно-лиловый
    { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF2ED' } }, // Мягкий зелёно-серый
  ]

  let colorIndex = 0 // Текущий индекс для выбора цвета
  const seenKeys = new Map() // Карта для хранения ключей и строк

  // Поиск всех строк-дубликатов
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // Пропускаем заголовок

    const taskIdValue = (row.getCell(taskIdIndex).value || '').toString().trim()
    if (!taskIdValue) return

    if (!seenKeys.has(taskIdValue)) {
      // Новая группа, увеличиваем индекс цвета
      seenKeys.set(taskIdValue, { rows: [rowNumber], colorIndex })
      colorIndex = (colorIndex + 1) % DUPLICATE_COLORS.length
    } else {
      // Существующая группа
      seenKeys.get(taskIdValue).rows.push(rowNumber)
    }
  })

  // Применяем подсветку только к группам с более чем одним повторением
  seenKeys.forEach(({ rows, colorIndex }) => {
    if (rows.length > 1) {
      rows.forEach(rowNumber => {
        worksheet.getRow(rowNumber).getCell(createdIndex).fill = DUPLICATE_COLORS[colorIndex]
      })
    }
  })

  console.log('Подсветка завершена.')
}

async function highlightCorrectColumn(worksheet) {
  if (!worksheet) throw new Error('Лист не определён.')

  const settings = loadJSON(settingsPath)
  const highlightColors = settings.highlightColors || {}
  console.log(highlightColors)

  const headerRow = worksheet.getRow(1)
  const correctIndex = headerRow.values.findIndex(value => value === 'correct')
  if (correctIndex === -1) {
    console.log('Столбец "correct" не найден.')
    return
  }

  // Пробегаем все строки
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // Пропускаем заголовок

    const cell = row.getCell(correctIndex)
    const cellValue = (cell.value || '').toString().trim()

    if (highlightColors[cellValue]) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: highlightColors[cellValue].fill },
      }
      cell.font = {
        color: { argb: highlightColors[cellValue].text },
        size: 10, // Устанавливаем размер шрифта явно
      }
    }
  })

  console.log('Подсветка завершена.')
}

module.exports = { highlightDuplicates, highlightCorrectColumn }
