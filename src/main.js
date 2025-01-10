const { app, BrowserWindow, ipcMain } = require('electron')
const fs = require('fs')
const os = require('os')
const path = require('path')
const ExcelJS = require('exceljs')

const logger = require('./logger')
const { Initialize } = require('./windows/mainWindow')
const handleSelectFile = require('./utils/selectFile')
const handleSaveFile = require('./utils/saveFile')
const { loadRenameMap, renameColumns } = require('./utils/renameColumns')
const processWorksheet = require('./sheets/mod')
const setStats = require('./sheets/stats')
const sortByDate = require('./utils/sorting')
const { highlightDuplicates, highlightCorrectColumn } = require('./utils/highlight')
const updateLinks = require('./utils/updateLinks')

const { setStaticColWidth } = require('./utils/colWidth')
const { setFontSize, setHeaderHeight } = require('./utils/fontSize')
const updateDates = require('./utils/formatDate')

const stateFilePath = path.join(process.cwd(), 'settings.json')

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

ipcMain.handle('process-file', async (event, filePath, toggleColumnCorrect, toggleColumnComment, toggleHiglight, toggleHighlightCorrect) => {
  if (!filePath) {
    logger.error('file path was not get')
    return
  }
  try {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(filePath)

    const worksheet = workbook.worksheets[0]
    worksheet.name = 'data'

    if (!worksheet) {
      throw new Error('sheet not found')
    }

    const data = []
    worksheet.eachRow((row, rowNumber) => {
      data.push(row.values)
    })

    const headerRow = worksheet.getRow(1).values.slice(1)

    const projectToValIndex = headerRow.indexOf('project_to_val') + 1
    const validatorAnswerIndex = headerRow.indexOf('validator_answer') + 1
    const assessorAnswerIndex = headerRow.indexOf('assessor_answer') + 1

    const asCreatedIndex = headerRow.indexOf('as_created') + 1
    const valCreatedIndex = headerRow.indexOf('val_created') + 1

    const valProjectdIndex = headerRow.indexOf('val_project') + 1
    const valTaskIdIndex = headerRow.indexOf('val_task_id') + 1
    const taskExtIdIndex = headerRow.indexOf('task_ext_id1') + 1

    if (validatorAnswerIndex === -1 || assessorAnswerIndex === -1 || asCreatedIndex === -1 || valCreatedIndex === -1) {
      logger.error(`no found columns: "as_task_id, project_to_val" & "validator_answer & "assessor_answer"`)
      return {
        error: `no found columns: "as_task_id, project_to_val" & "validator_answer" & "assessor_answer"`,
      }
    }

    await sortByDate(worksheet, asCreatedIndex)

    if (toggleHiglight) await highlightDuplicates(worksheet)

    await updateLinks(worksheet)

    updateAnswers(worksheet, validatorAnswerIndex, assessorAnswerIndex)

    if (toggleColumnCorrect) {
      await moveColumnsToEnd(worksheet, ['correct'])
    }

    if (toggleColumnComment) {
      await moveColumnsToEnd(worksheet, ['comment_by_validator'])
      await moveColumnsToEnd(worksheet, ['validator_Причина'])
      await moveColumnsToEnd(worksheet, ['validator_Причина по стоимости'])
      await moveColumnsToEnd(worksheet, ['reason_by_validator'])
      await moveColumnsToEnd(worksheet, ['reason_by_validator_avail'])
      await moveColumnsToEnd(worksheet, ['reason_by_validator_price'])
      await moveColumnsToEnd(worksheet, ['reason_by_validator_discr'])
    }

    if (toggleHighlightCorrect) await highlightCorrectColumn(worksheet)

    setStaticColWidth(worksheet, 20)

    setFontSize(worksheet, 10, true)
    setHeaderHeight(worksheet, 30)

    setAlignment(worksheet)

    await setStats(worksheet)

    await updateDates(worksheet, asCreatedIndex, valCreatedIndex)

    await processWorksheet(worksheet)

    removeColumns(worksheet, validatorAnswerIndex, assessorAnswerIndex, projectToValIndex, valProjectdIndex, valTaskIdIndex, taskExtIdIndex)

    logger.info('trying to save a temp file')
    const tempDir = os.tmpdir()
    const tempFilePath = path.join(tempDir, `temp_${Date.now()}.xlsx`)
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

async function updateAnswers(worksheet, validatorAnswerIndex, assessorAnswerIndex) {
  const headerRow = worksheet.getRow(1) // Заголовок таблицы

  const existingHeaders = headerRow.values.slice(1).filter(header => header !== undefined)

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // Пропускаем заголовок

    const validatorAnswer = row.getCell(validatorAnswerIndex).value
    const assessorAnswer = row.getCell(assessorAnswerIndex).value

    // Обработка JSON для validator_answer
    if (validatorAnswer) {
      try {
        const parsedValidator = JSON.parse(validatorAnswer)
        for (const [key, value] of Object.entries(parsedValidator)) {
          const columnName = `validator_${key}`
          let columnIndex = existingHeaders.indexOf(columnName) + 1 // Индексы ExcelJS начинаются с 1

          // Если колонка отсутствует, добавляем её в заголовок
          if (columnIndex === 0) {
            existingHeaders.push(columnName)
            columnIndex = existingHeaders.length
            headerRow.getCell(columnIndex).value = columnName
          }

          // Устанавливаем значение в соответствующую ячейку
          row.getCell(columnIndex).value = Array.isArray(value) ? value.join(', ') : value
        }
      } catch (error) {
        console.warn(`Ошибка парсинга JSON в столбце validator_answer на строке ${rowNumber}`)
      }
    }

    // Обработка JSON для assessor_answer
    if (assessorAnswer) {
      try {
        const parsedAssessor = JSON.parse(assessorAnswer)
        for (const [key, value] of Object.entries(parsedAssessor)) {
          const columnName = `assessor_${key}`
          let columnIndex = existingHeaders.indexOf(columnName) + 1 // Индексы ExcelJS начинаются с 1

          // Если колонка отсутствует, добавляем её в заголовок
          if (columnIndex === 0) {
            existingHeaders.push(columnName)
            columnIndex = existingHeaders.length
            headerRow.getCell(columnIndex).value = columnName
          }

          // Устанавливаем значение в соответствующую ячейку
          row.getCell(columnIndex).value = Array.isArray(value) ? value.join(', ') : value
        }
      } catch (error) {
        console.warn(`Ошибка парсинга JSON в столбце assessor_answer на строке ${rowNumber}`)
      }
    }

    row.commit()
  })

  headerRow.commit()
}

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

async function moveColumnsToEnd(worksheet, columnNames) {
  if (!worksheet) throw new Error('sheet is not defined')

  const headerRow = worksheet.getRow(1) // Первая строка - заголовки
  const columnIndexes = []

  // Получение индексов столбцов
  columnNames.forEach(columnName => {
    const columnIndex = headerRow.values.findIndex(value => value === columnName)
    if (columnIndex === -1) {
      logger.info(`no columns found: "${columnName}"`)
    } else {
      columnIndexes.push(columnIndex)
    }
  })

  if (columnIndexes.length === 0) {
    logger.info('skipping')
    return
  }

  // Сортировка индексов в порядке убывания (чтобы корректно удалять столбцы)
  columnIndexes.sort((a, b) => b - a)

  // Сохраняем данные перемещаемых столбцов
  const columnDataMap = columnIndexes.map(index => {
    const columnData = []
    worksheet.eachRow(row => {
      columnData.push(row.getCell(index).value)
    })
    return columnData
  })

  // Удаляем исходные столбцы
  columnIndexes.forEach(index => worksheet.spliceColumns(index, 1))

  // Добавляем столбцы в конецs
  columnDataMap.forEach((columnData, idx) => {
    const newColumnIndex = worksheet.columnCount // Новый индекс столбца
    columnData.forEach((value, rowIndex) => {
      worksheet.getRow(rowIndex + 1).getCell(newColumnIndex).value = value
    })

    // Устанавливаем заголовок
    const columnName = columnNames[idx]
    worksheet.getRow(1).getCell(newColumnIndex).value = columnName
  })

  console.log('successfully moved to the end')
}
