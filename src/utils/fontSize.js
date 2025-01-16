function setFontSize(worksheet, fontSize = 10, isHeader = false) {
  if (!worksheet) throw new Error('Лист не определён.')

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell(cell => {
      if (isHeader && rowNumber === 1) {
        cell.font = { size: fontSize, bold: true } // Apply styles to headers
      } else {
        cell.font = { size: fontSize } // Apply styles to content
      }
    })
  })
}

async function setHeaderHeight(worksheet, height) {
  if (!worksheet) throw new Error('Лист не определён.')
  if (!height || height <= 0) throw new Error('Высота должна быть положительным числом.')

  const headerRow = worksheet.getRow(1)
  headerRow.height = height
  headerRow.commit()
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

module.exports = { setFontSize, setHeaderHeight, setAlignment }
