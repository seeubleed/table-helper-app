const ExcelJS = require('exceljs')

const core = async (filePath, options) => {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  const worksheet = workbook.worksheets[0]
  worksheet.name = 'data'

  const tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}.xlsx`)
  await workbook.xlsx.writeFile(tempFilePath)

  return tempFilePath
}

module.exports = { core }
