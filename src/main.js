const { app, BrowserWindow, ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater')

const fs = require('fs')
const os = require('os')
const path = require('path')
const ExcelJS = require('exceljs')

const logger = require('./logger')
const { Initialize, getMainWindow } = require('./windows/mainWindow')
const handleSelectFile = require('./utils/selectFile')
const handleSaveFile = require('./utils/saveFile')
const processWorksheet = require('./sheets/mod')
const setStats = require('./sheets/stats')
const sortByDate = require('./utils/sorting')
const { highlightDuplicates, highlightCorrectColumn } = require('./utils/highlight')
const updateLinks = require('./utils/updateLinks')

const { setStaticColWidth } = require('./utils/colWidth')
const { setFontSize, setHeaderHeight } = require('./utils/fontSize')
const updateDates = require('./utils/formatDate')

const removeColumns = require('./utils/removeColumns')

const moveColumnsToEnd = require('./utils/moveColumns')

const updateAnswers = require('./utils/updateAnswers')

const stateFilePath = path.join(process.cwd(), 'settings.json')

const { loadRenameMap, renameColumns } = require('./utils/renameColumns')
const renameMapPath = path.join(process.cwd(), 'options.json')
// const renameMap = loadRenameMap(renameMapPath)

ipcMain.handle('load-options', async () => {
  const optionsPath = path.join(process.cwd(), 'options.json')
  const data = fs.readFileSync(optionsPath, 'utf8')
  return JSON.parse(data)
})

ipcMain.handle('save-options', async (_, updatedOptions) => {
  const optionsPath = path.join(process.cwd(), 'options.json')
  fs.writeFileSync(optionsPath, JSON.stringify(updatedOptions, null, 2), 'utf8')
  return 'success'
})

ipcMain.handle('save-checkbox-state', async (event, state) => {
  try {
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf-8')
    return { success: true }
  } catch (error) {
    console.error('Ошибка сохранения состояния чекбоксов:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('load-checkbox-state', async () => {
  try {
    if (fs.existsSync(stateFilePath)) {
      const data = fs.readFileSync(stateFilePath, 'utf-8')
      return JSON.parse(data)
    }
    return {}
  } catch (error) {
    console.error('Ошибка загрузки состояния чекбоксов:', error)
    return {}
  }
})

app.on('ready', () => {
  Initialize()
})

ipcMain.on('restart_app', () => {
  logger.info('Перезапуск приложения для установки обновления.')
  autoUpdater.quitAndInstall()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    Initialize()
  }
})

ipcMain.on('window-minimize', event => {
  const window = BrowserWindow.getFocusedWindow()
  if (window) window.minimize()
})

ipcMain.on('window-close', event => {
  const window = BrowserWindow.getFocusedWindow()
  logger.info('Приложение завершено')
  if (window) window.close()
})

ipcMain.handle('select-file', handleSelectFile)

ipcMain.handle('process-file', async (event, filePath, options) => {
  try {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(filePath)
    const worksheet = workbook.worksheets[0]
    worksheet.name = 'data'

    const headerRow = worksheet.getRow(1).values.slice(1)

    const projectToValIndex = headerRow.indexOf('project_to_val') + 1
    const validatorAnswerIndex = headerRow.indexOf('validator_answer') + 1
    const assessorAnswerIndex = headerRow.indexOf('assessor_answer') + 1
    const asCreatedIndex = headerRow.indexOf('as_created') + 1
    const valCreatedIndex = headerRow.indexOf('val_created') + 1
    const valProjectdIndex = headerRow.indexOf('val_project') + 1
    const valTaskIdIndex = headerRow.indexOf('val_task_id') + 1
    const taskExtIdIndex = headerRow.indexOf('task_ext_id1') + 1

    await sortByDate(worksheet, asCreatedIndex)

    if (options.highlight) await highlightDuplicates(worksheet)

    await updateLinks(worksheet, options.switchModeLinks, options.switchModeLinksChange)

    updateAnswers(worksheet, validatorAnswerIndex, assessorAnswerIndex)

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

    await setStats(worksheet)

    await updateDates(worksheet, asCreatedIndex, valCreatedIndex)

    await processWorksheet(worksheet)

    removeColumns(worksheet, validatorAnswerIndex, assessorAnswerIndex, projectToValIndex, valProjectdIndex, valTaskIdIndex, taskExtIdIndex)

    const renameMap = loadRenameMap(renameMapPath)
    renameColumns(worksheet, renameMap.Map)

    logger.info('trying to save a temp file')
    const tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}.xlsx`)
    await workbook.xlsx.writeFile(tempFilePath)
    logger.info(`temp file saved: ${tempFilePath}`)

    return { success: true, tempFilePath }
  } catch (error) {
    return { error: error.message }
  }
})

ipcMain.handle('save-file', async (event, tempFilePath) => {
  return handleSaveFile(event, tempFilePath)
})

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
        // Для остальных колонок: содержимое по центру
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
        }
      })
    }
  })
}
