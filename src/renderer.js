document.addEventListener('DOMContentLoaded', async () => {
  const minimizeButton = document.getElementById('minimize')
  const closeButton = document.getElementById('close')
  const loadingIndicator = document.getElementById('loading')
  const processButton = document.getElementById('processButton')

  const tabs = document.querySelectorAll('.tab-btn')
  const sections = document.querySelectorAll('.tab-section')

  const settingsContainer = document.getElementById('settingsContainer')
  const saveButton = document.getElementById('saveButton')

  const appVersion = await globalThis.appInfo.getVersion()
  document.getElementById('app-version').textContent = `Версия: ${appVersion}`

  // Загрузка текущих настроек
  const options = await globalThis.electronAPI.loadOptions()
  const map = options.Map

  const settings = await globalThis.electronAPI.loadSettings()
  const colorsContainer = document.getElementById('colors')
  const highlightColors = settings.highlightColors || {}

  console.log('Настройки:', settings)
  console.log('highlightColors:', highlightColors)

  const renderColors = async () => {
    for (const [key, value] of Object.entries(highlightColors)) {
      const colorRow = document.createElement('div')
      colorRow.className = 'color-row'
      colorRow.innerHTML = `
          <label>${key}</label>
          <label>Заливка:</label>
          <input type="color" id="fill-${key}" value="#${value.fill.slice(2)}" />
          <label>Шрифт:</label>
          <input type="color" id="text-${key}" value="#${value.text.slice(2)}" />
        `
      colorsContainer.appendChild(colorRow)

      // Асинхронная пауза для предотвращения блокировки интерфейса
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }
  await renderColors()

  document.getElementById('saveColors').addEventListener('click', async () => {
    const updatedColors = {}
    for (const key of Object.keys(settings.highlightColors)) {
      updatedColors[key] = {
        fill: `FF${document.getElementById(`fill-${key}`).value.slice(1)}`,
        text: `FF${document.getElementById(`text-${key}`).value.slice(1)}`,
      }
    }
    settings.highlightColors = updatedColors
    await globalThis.electronAPI.saveSettings(settings)
    alert('Настройки сохранены!')
  })

  // Создание формы
  Object.keys(map).forEach(key => {
    const div = document.createElement('div')
    div.innerHTML = `
        <label>
          ${key}:
          <input type="text" name="${key}" value="${map[key]}" />
        </label>
      `
    settingsContainer.appendChild(div)
  })

  saveButton.addEventListener('click', async () => {
    const formData = new FormData(document.getElementById('settingsForm'))
    const updatedMap = {}

    for (const [key, value] of formData.entries()) {
      updatedMap[key] = value
    }

    options.Map = updatedMap
    await globalThis.electronAPI.saveOptions(options)

    alert('Настройки сохранены!')
  })

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Удаляем активный класс у всех вкладок и секций
      tabs.forEach(t => t.classList.remove('active'))
      sections.forEach(section => section.classList.remove('active'))

      // Добавляем активный класс к выбранной вкладке и секции
      tab.classList.add('active')
      const targetId = tab.getAttribute('data-tab')
      document.getElementById(targetId).classList.add('active')
    })
  })

  globalThis.electronAPI.onUpdateAvailable(() => {
    const notificationArea = document.getElementById('notification-area')
    notificationArea.innerHTML = `
      <div class="notification">
        <p>Доступно обновление! Оно скоро будет загружено.</p>
      </div>
    `
    notificationArea.classList.add('show')
  })

  globalThis.electronAPI.onUpdateDownloaded(() => {
    const notificationArea = document.getElementById('notification-area')
    notificationArea.innerHTML = `
      <div class="notification">
        <p>Обновление загружено. Перезапустите приложение, чтобы применить его.</p>
        <button id="restart-button">Перезапустить</button>
      </div>
    `
    notificationArea.classList.add('show')

    document.getElementById('restart-button').addEventListener('click', () => {
      globalThis.electronAPI.restartApp()
    })
  })

  const checkboxIds = ['toggle-higlight', 'toggle-column-correct', 'toggle-column-comment', 'toggle-higlight-correct', 'toggle-switch_mode_links', 'toggle-switch_mode_links_change', 'toggle-rename-titles']

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

  processButton.addEventListener('click', async () => {
    try {
      const checkboxStates = getCheckboxStates()

      const options = {
        toggleColumnCorrect: checkboxStates['toggle-column-correct'],
        toggleColumnComment: checkboxStates['toggle-column-comment'],
        highlight: checkboxStates['toggle-higlight'],
        highlightCorrect: checkboxStates['toggle-higlight-correct'],
        switchModeLinks: checkboxStates['toggle-switch_mode_links'],
        switchModeLinksChange: checkboxStates['toggle-switch_mode_links_change'],
        toggleRenameTitles: checkboxStates['toggle-rename-titles'],
      }

      const selectF = await globalThis.electronAPI.selectFile()
      if (selectF.error) {
        updateLog(`Ошибка: ${selectF.error}`)
        return
      }
      const filePath = selectF.filePath
      if (!filePath) {
        updateLog(`filePath отсутствует`)
        return
      }

      // show loading bar
      loadingIndicator.style.display = 'flex'

      // core process
      const processResult = await globalThis.electronAPI.processFile(filePath, options)

      // hide loading bar
      loadingIndicator.style.display = 'none'

      if (processResult.error) {
        updateLog(`Ошибка: ${processResult.error}`)
        return
      } else {
        updateLog(`Файл успешно обработан`)
      }

      const resultSave = await globalThis.electronAPI.saveFile(processResult.tempFilePath)

      if (resultSave.error) {
        updateLog(`Ошибка: ${resultSave.error}`)
        return
      } else {
        updateLog(resultSave.message)
      }
    } catch (error) {
      //hide loading bar
      loadingIndicator.style.display = 'none'
      updateLog(`Ошибка: ${error.message}`)
    }
  })

  function updateLog(message) {
    const outputElement = document.getElementById('output')
    outputElement.textContent = message

    outputElement.style.display = message.trim() ? 'block' : 'none'
  }
})
