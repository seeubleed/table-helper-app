const ExcelJS = require('exceljs')
const path = require('path')
const os = require('os')

const sortByDate = require('./utils/sort')
const { highlightDuplicates, highlightCorrectColumn } = require('./utils/highlight')
const updateLinks = require('./utils/updateLinks')
const updateAnswers = require('./utils/updateAnswers')
const moveColumnsToEnd = require('./utils/moveColumns')
const { setStaticColWidth } = require('./utils/colWidth')
const { setFontSize, setHeaderHeight, setAlignment } = require('./utils/fontSize')
const updateDates = require('./utils/formatDate')
const removeColumns = require('./utils/removeColumns')
const { loadRenameMap, renameColumns } = require('./utils/renameColumns')
const renameMapPath = path.join(process.cwd(), 'options.json')

async function core(filePath, options) {
  const workbook = await loadWorkbook(filePath)
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

  if (options.highlightCorrect) await highlightCorrectColumn(worksheet)

  setStaticColWidth(worksheet, 20)
  setFontSize(worksheet, 10, true)
  setHeaderHeight(worksheet, 30)
  setAlignment(worksheet)

  //   await setStats(worksheet)

  await updateDates(worksheet)

  //   await processWorksheet(worksheet)

  removeColumns(worksheet)

  //   const orderConfig = JSON.parse(fs.readFileSync('./columnsOrder.json', 'utf-8'))

  // await rearrangeColumns(worksheet, orderConfig.columnsOrder)

  const renameMap = loadRenameMap(renameMapPath)
  renameColumns(worksheet, renameMap.Map)

  const tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}.xlsx`)
  await workbook.xlsx.writeFile(tempFilePath)
  console.log(`temp file saved: ${tempFilePath}`)

  return tempFilePath
}

async function loadWorkbook(filePath) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  return workbook
}

function prepareWorksheet(workbook) {
  const worksheet = workbook.worksheets[0]
  if (!worksheet) throw new Error('Sheet not found')
  worksheet.name = 'data'
  return worksheet
}

module.exports = core
