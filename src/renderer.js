document.addEventListener('DOMContentLoaded', async () => {
  const minimizeButton = document.getElementById('minimize')
  const closeButton = document.getElementById('close')
  const loadingIndicator = document.getElementById('loading')
  const btn = document.getElementById('processButton')

  const notificationArea = document.getElementById('notification-area')

  // Событие: доступно обновление
  globalThis.electronAPI.onUpdateAvailable(() => {
    const notification = document.createElement('div')
    notification.innerText = 'Доступно обновление! Оно скоро будет загружено.'
    notificationArea.appendChild(notification)
  })

  // Событие: обновление загружено
  globalThis.electronAPI.onUpdateDownloaded(() => {
    const notification = document.createElement('div')
    notification.innerHTML = `
      <p>Обновление загружено. Перезапустите приложение, чтобы применить его.</p>
      <button id="restart-button">Перезапустить</button>
    `
    notificationArea.appendChild(notification)

    document.getElementById('restart-button').addEventListener('click', () => {
      globalThis.electronAPI.restartApp()
    })
  })

  const checkboxIds = ['toggle-higlight', 'toggle-column-correct', 'toggle-column-comment', 'toggle-higlight-correct', 'toggle-switch_mode_links', 'toggle-switch_mode_links_change']

  const savedState = await globalThis.electronAPI.loadCheckboxState()

  checkboxIds.forEach(id => {
    const checkbox = document.getElementById(id)
    if (checkbox) {
      checkbox.checked = savedState[id] ?? false
      checkbox.addEventListener('change', saveState)
    }
  })

  async function saveState() {
    const state = getCheckboxStates()
    await globalThis.electronAPI.saveCheckboxState(state)
  }

  function getCheckboxStates() {
    const states = {}
    checkboxIds.forEach(id => {
      const checkbox = document.getElementById(id)
      if (checkbox) {
        states[id] = checkbox.checked
      }
    })
    return states
  }

  minimizeButton.addEventListener('click', () => {
    globalThis.electronAPI.minimizeWindow()
  })

  closeButton.addEventListener('click', () => {
    globalThis.electronAPI.closeWindow()
  })

  btn.addEventListener('click', async () => {
    try {
      const checkboxStates = getCheckboxStates()

      const result = await globalThis.electronAPI.selectFile()

      if (result.error) {
        updateOutput(`Ошибка: ${result.error}`)
        return
      }

      loadingIndicator.style.display = 'flex'

      const processResult = await globalThis.electronAPI.processFile(
        result.filePath,
        checkboxStates['toggle-column-correct'],
        checkboxStates['toggle-column-comment'],
        checkboxStates['toggle-higlight'],
        checkboxStates['toggle-higlight-correct'],
        checkboxStates['toggle-switch_mode_links'],
        checkboxStates['toggle-switch_mode_links_change']
      )

      loadingIndicator.style.display = 'none'

      if (processResult.error) {
        updateOutput(`Ошибка: ${processResult.error}`)
        return
      } else {
        updateOutput(`Файл успешно обработан`)
      }

      const resultSave = await globalThis.electronAPI.saveFile(processResult.tempFilePath)

      if (resultSave.error) {
        updateOutput(`Ошибка: ${resultSave.error}`)
        return
      } else {
        updateOutput(resultSave.message)
      }
    } catch (error) {
      loadingIndicator.style.display = 'none'
      updateOutput(`Ошибка: ${error.message}`)
    }
  })

  function updateOutput(message) {
    const outputElement = document.getElementById('output')
    outputElement.textContent = message

    outputElement.style.display = message.trim() ? 'block' : 'none'
  }
})
