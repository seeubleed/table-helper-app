const logger = require('../logger')

async function updateLinks(worksheet, toggleSwitchModeLinks, toggleSwitchModeLinksChange) {
  const headerRow = worksheet.getRow(1).values.slice(1)

  const taskExtIdIndex = headerRow.indexOf('validator_task_ext') + 1
  const valProjectIndex = headerRow.indexOf('validation_project') + 1

  const asTaskIdIndex = headerRow.indexOf('assesors_task') + 1
  const projectToValIndex = headerRow.indexOf('assesor_project') + 1

  if (taskExtIdIndex === 0 || valProjectIndex === 0) {
    logger.error('no columns found: "task_ext_id" & "val_project", skipping')
    return
  }

  if (asTaskIdIndex === 0 || projectToValIndex === 0) {
    logger.error('no columns found: "asTaskIdIndex" & "projectToValIndex", skipping')
    return
  }

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // Пропускаем заголовок

    const projectId = row.getCell(valProjectIndex).value
    const extId = row.getCell(taskExtIdIndex).value

    if (projectId && extId) {
      const prefix = `https://centiman.avito.ru/service-dataset-collector-frontend/project/${projectId}/answer/ext_id/`

      row.getCell(taskExtIdIndex).value = {
        text: toggleSwitchModeLinksChange ? `Изменить ответ` : `${prefix}${extId}`,
        hyperlink: `${prefix}${extId}`,
      }

      row.commit()
    }

    const projectID = row.getCell(projectToValIndex).value
    const taskId = row.getCell(asTaskIdIndex).value

    if (projectID && taskId) {
      const prefix = `https://centiman.avito.ru/service-dataset-collector-frontend/manage_project/${projectID}/task/`

      row.getCell(asTaskIdIndex).value = {
        text: toggleSwitchModeLinks ? `${taskId}` : `${prefix}${taskId}`,
        hyperlink: `${prefix}${taskId}`,
      }

      row.commit()
    }
  })
}

module.exports = updateLinks
