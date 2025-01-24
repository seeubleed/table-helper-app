const ExcelJS = require('exceljs')
const path = require('path')
const os = require('os')
const fs = require('fs')

const sortByDate = require('./components/sort')
const { highlightDuplicates, highlightCorrectColumn } = require('./components/highlight')
const updateLinks = require('./utils/updateLinks')
// const updateAnswers = require('./utils/updateAnswers')
const { setStaticColWidth } = require('./utils/colWidth')
const { setFontSize, setHeaderHeight, setAlignment } = require('./utils/fontSize')
const updateDates = require('./utils/formatDate')
const { loadRenameMap, renameColumns } = require('./utils/renameColumns')

const renameMapPath = path.join(process.resourcesPath, 'options.json')

const rearrangeColumns = require('./utils/reorderColumns')

const errorRateTab = require('./tabs/errorRate')

async function core(filePath, ext, options) {
  const workbook = await loadWorkbook(filePath, ext)
  const worksheet = prepareWorksheet(workbook)

  await sortByDate(worksheet)

  if (options.highlight) await highlightDuplicates(worksheet)

  await updateLinks(worksheet, options.switchModeLinks, options.switchModeLinksChange)

  //   updateAnswers(worksheet)

  const orderConfigPath = path.join(process.resourcesPath, 'columns.json')
  const orderConfig = JSON.parse(fs.readFileSync(orderConfigPath, 'utf8'))
  await rearrangeColumns(worksheet, orderConfig)

  setStaticColWidth(worksheet, 20)
  setFontSize(worksheet, 10, true)
  setHeaderHeight(worksheet, 30)
  setAlignment(worksheet)

  if (options.highlightCorrect) await highlightCorrectColumn(worksheet)

  if (options.toggleErrorRateTab) {
    await errorRateTab(worksheet)
  }

  await updateDates(worksheet)

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

  const worksheet = workbook.getWorksheet(1)

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
  worksheet.name = 'Данные'
  return worksheet
}

module.exports = core
