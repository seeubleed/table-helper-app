function setBorder(worksheet) {
  worksheet.eachRow((row, rowIndex) => {
    // Перебираем все столбцы в диапазоне строки
    const maxCol = worksheet.columnCount
    for (let colIndex = 1; colIndex <= maxCol; colIndex++) {
      const cell = row.getCell(colIndex)
      cell.border = {
        top: { style: 'double', color: { argb: 'FF000000' } },
        left: { style: 'dashed', color: { argb: 'FF000000' } },
        bottom: { style: 'hair', color: { argb: 'FF000000' } },
        right: { style: 'dashed', color: { argb: 'FF000000' } },
      }
    }
  })
}

module.exports = setBorder
