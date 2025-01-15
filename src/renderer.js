document.addEventListener('DOMContentLoaded', async () => {
  const minimizeButton = document.getElementById('minimize')
  const closeButton = document.getElementById('close')
  const loadingIndicator = document.getElementById('loading')
  const btn = document.getElementById('processButton')

  const tabs = document.querySelectorAll('.tab-btn')
  const sections = document.querySelectorAll('.tab-section')

  const settingsContainer = document.getElementById('settingsContainer')
  const saveButton = document.getElementById('saveButton')

  // Загрузка текущих настроек
  const options = await globalThis.electronAPI.loadOptions()
  const map = options.Map

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
