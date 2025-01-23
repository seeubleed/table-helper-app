const ExcelJS = require('exceljs')
const { dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const logger = require('../logger')

async function handleSaveFile(tempFilePath, format = 'xlsx') {
  const now = new Date()
  const timeString = now.toLocaleString('ru-RU', { hour12: false }).replace(/[^0-9]/g, ' ')

  let fileFormat = format.toLowerCase()

  try {
    const { filePath: savePath } = await dialog.showSaveDialog({
      title: 'Сохранить файл как',
      defaultPath: `table_${timeString}.${format}`,
      filters: [
        { name: 'Excel Files', extensions: ['xlsx'] },
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'JSON Files', extensions: ['json'] },
      ],
    })

    if (!savePath) {
      if (tempFilePath) fs.unlinkSync(tempFilePath)
      return { error: 'Сохранение было отменено пользователем.' }
    }

    const ext = path.extname(savePath).toLowerCase()
    if (ext) {
      // Переопределяем формат на основе расширения
      fileFormat = ext.replace('.', '')
    }

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(tempFilePath)

    switch (fileFormat) {
      case 'xlsx':
        await workbook.xlsx.writeFile(savePath) // Сохранение в формате Excel
        break
      case 'csv': {
        const worksheet = workbook.getWorksheet(1) // Первый лист
        if (!worksheet) {
          throw new Error('Лист не найден в рабочей книге.')
        }

        const csvString = await worksheetToCsv(worksheet)
        fs.writeFileSync(savePath, csvString, 'utf8')
        break
      }
      case 'json': {
        const worksheet = workbook.getWorksheet(1)
        if (!worksheet) {
          throw new Error('Лист не найден в рабочей книге.')
        }
        const jsonOutput = worksheetToJson(worksheet)
        fs.writeFileSync(savePath, JSON.stringify(jsonOutput, null, 2), 'utf8')
        break
      }
      default:
        throw new Error(`Формат "${fileFormat}" не поддерживается.`)
    }

    fs.unlinkSync(tempFilePath) // Удаляем временный файл

    logger.info(`Файл успешно обработан и сохранён в ${savePath}`)
    return {
      message: `Файл успешно обработан и сохранён в ${savePath}`,
    }
  } catch (error) {
    logger.error('Ошибка сохранения файла:', error)
    return { error: error.message }
  }
}

function worksheetToJson(worksheet) {
  const json = []
  const headers = []

  // Логируем заголовки
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = cell.value || `Column${colNumber}`
  })
  console.log('Headers:', headers)

  // Логируем строки данных
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // Пропускаем строку заголовков

    const rowData = {}
    row.eachCell((cell, colNumber) => {
      console.log(`Row ${rowNumber}, Column ${colNumber}:`, cell.value) // Логируем каждую ячейку
      rowData[headers[colNumber]] = cell.value
    })

    console.log(`Row ${rowNumber} Data:`, rowData) // Логируем собранную строку
    json.push(rowData)
  })

  return json
}

async function worksheetToCsv(worksheet) {
  const rows = []

  worksheet.eachRow((row, rowNumber) => {
    const rowData = []
    row.eachCell(cell => {
      let cellValue = cell.value

      // Если ячейка содержит ссылку, обрабатываем её отдельно
      if (cell.type === ExcelJS.ValueType.Hyperlink) {
        // Если ячейка является гиперссылкой, извлекаем текст ссылки или саму ссылку
        cellValue = cell.hyperlink
      } else if (cellValue instanceof Date) {
        // Преобразуем дату в строку
        cellValue = formatDate(cellValue)
      } else if (typeof cellValue === 'object') {
        // Преобразуем объект в строку (например, JSON строка)
        cellValue = JSON.stringify(cellValue)
      } else {
        // Преобразуем остальные значения в строку
        cellValue = String(cellValue)
      }

      rowData.push(cellValue) // Добавляем обработанное значение в строку
    })
    rows.push(rowData.join(',')) // Преобразуем строку, разделенную запятыми
  })

  return rows.join('\n') // Возвращаем строки CSV
}

// Функция для форматирования даты в строку
function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    throw new Error('Invalid date')
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}` // Возвращаем ISO-совместимый формат
}

module.exports = handleSaveFile
