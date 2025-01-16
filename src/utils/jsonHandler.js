const fs = require('fs')

const loadJSON = filePath => {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  }
  return {}
}

const saveJSON = (filePath, content) => {
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8')
}

module.exports = { loadJSON, saveJSON }
