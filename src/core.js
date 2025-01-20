const ExcelJS = require('exceljs')
const path = require('path')
const os = require('os')

const sortByDate = require('./components/sort')
const { highlightDuplicates, highlightCorrectColumn } = require('./components/highlight')
const updateLinks = require('./utils/updateLinks')
const updateAnswers = require('./utils/updateAnswers')
const moveColumnsToEnd = require('./utils/moveColumns')
const { setStaticColWidth } = require('./utils/colWidth')
const { setFontSize, setHeaderHeight, setAlignment } = require('./utils/fontSize')
const updateDates = require('./utils/formatDate')
const removeColumns = require('./utils/removeColumns')
const { loadRenameMap, renameColumns } = require('./utils/renameColumns')
const renameMapPath = path.join(process.cwd(), 'options.json')

async function core(filePath, ext, options) {
  console.log('FilePath:', filePath)
  console.log('Extension:', ext)
  console.log('Options:', options)

  const workbook = await loadWorkbook(filePath, ext)
  const worksheet = prepareWorksheet(workbook)

  await sortByDate(worksheet)

  if (options.highlight) await highlightDuplicates(worksheet)

  await updateLinks(worksheet, options.switchModeLinks, options.switchModeLinksChange)

  updateAnswers(worksheet)

  if (options.toggleColumnCorrect) {
    await moveColumnsToEnd(worksheet, ['correct'])
  }

  if (options.toggleColumnComment) {
    await moveColumnsToEnd(worksheet, ['comment_by_validator'])
    await moveColumnsToEnd(worksheet, ['validator_Причина'])
    await moveColumnsToEnd(worksheet, ['validator_Причина по стоимости'])
    await moveColumnsToEnd(worksheet, ['reason_by_validator'])
    await moveColumnsToEnd(worksheet, ['reason_by_validator_avail'])
    await moveColumnsToEnd(worksheet, ['reason_by_validator_price'])
    await moveColumnsToEnd(worksheet, ['reason_by_validator_discr'])
  }

  setStaticColWidth(worksheet, 20)
  setFontSize(worksheet, 10, true)
  setHeaderHeight(worksheet, 30)
  setAlignment(worksheet)

  if (options.highlightCorrect) await highlightCorrectColumn(worksheet)

  //   await setStats(worksheet)

  await updateDates(worksheet)

  //   await processWorksheet(worksheet)

  removeColumns(worksheet)

  //   const orderConfig = JSON.parse(fs.readFileSync('./columnsOrder.json', 'utf-8'))

  // await rearrangeColumns(worksheet, orderConfig.columnsOrder)

  if (options.toggleRenameTitles) {
    const renameMap = loadRenameMap(renameMapPath)
    renameColumns(worksheet, renameMap.Map)
  }

  const tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}.xlsx`)
  await workbook.xlsx.writeFile(tempFilePath)
  console.log(`temp file saved: ${tempFilePath}`)

  return tempFilePath
}

async function loadWorkbook(filePath, ext) {
  const workbook = new ExcelJS.Workbook()

  if (ext === '.csv') {
    await workbook.csv.readFile(filePath, {
      delimiter: ',', // Указание разделителя
      encoding: 'utf8', // Кодировка файла
      mapHeaders: ({ header }) => header.trim(), // Очистка заголовков
    })
  } else if (ext === '.xlsx') {
    await workbook.xlsx.readFile(filePath)
  }

  const worksheet = workbook.getWorksheet(1) // Получение первого листа

  // Обработка данных в ячейках
  worksheet.eachRow(row => {
    row.eachCell(cell => {
      // Проверяем, является ли значение датой
      if (cell.type === ExcelJS.ValueType.Date) {
        // Преобразуем дату в формат без времени
        cell.value = formatDate(cell.value)
      }
    })
  })

  return workbook
}

function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    throw new Error('Invalid date')
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  // Возвращаем ISO-совместимый формат
  return `${year}-${month}-${day}`
}

function prepareWorksheet(workbook) {
  const worksheet = workbook.worksheets[0]
  if (!worksheet) throw new Error('Sheet not found')
  worksheet.name = 'data'
  return worksheet
}

module.exports = core
