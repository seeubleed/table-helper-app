const AppAPI = {
  getVersion: () => globalThis.appInfo.getVersion(),
  loadOptions: () => globalThis.electronAPI.loadOptions(),
  saveOptions: options => globalThis.electronAPI.saveOptions(options),
  loadSettings: () => globalThis.electronAPI.loadSettings(),
  saveSettings: settings => globalThis.electronAPI.saveSettings(settings),
  selectFile: () => globalThis.electronAPI.selectFile(),
  processFile: (filePath, ext, options) => globalThis.electronAPI.processFile(filePath, ext, options),
  saveFile: tempFilePath => globalThis.electronAPI.saveFile(tempFilePath),
  loadCheckboxState: () => globalThis.electronAPI.loadCheckboxState(),
  saveCheckboxState: state => globalThis.electronAPI.saveCheckboxState(state),
  minimizeWindow: () => globalThis.electronAPI.minimizeWindow(),
  closeWindow: () => globalThis.electronAPI.closeWindow(),
}

document.addEventListener('DOMContentLoaded', async () => {
  const minimizeButton = document.getElementById('minimize')
  const closeButton = document.getElementById('close')
  const loadingIndicator = document.getElementById('loading')
  const processButton = document.getElementById('processButton')

  const tabs = document.querySelectorAll('.tab-btn')
  const sections = document.querySelectorAll('.tab-section')

  const settingsContainer = document.getElementById('settingsContainer')
  const saveButton = document.getElementById('saveButton')

  const appVersion = await AppAPI.getVersion()
  document.getElementById('app-version').textContent = `Версия: ${appVersion}`

  const settings = await AppAPI.loadSettings()
  const colorsContainer = document.getElementById('colors')
  const highlightColors = settings.highlightColors || {}
  await renderColors(colorsContainer, highlightColors)

  const script = document.createElement('script')
  script.src = './libs/Sortable.js' // Загрузка Sortable.js
  document.body.appendChild(script)

  script.onload = async () => {
    const container = document.getElementById('columnsContainer')

    // Загружаем данные из main
    const columns = await globalThis.electronAPI.loadColumns()

    // Создаем элементы
    columns.forEach((column, index) => {
      const columnItem = document.createElement('label') // Изменяем <div> на <label>
      columnItem.classList.add('column-item')
      columnItem.dataset.index = index
      columnItem.innerHTML = `
      <input type="checkbox" id="col_${index}" ${column.visible ? 'checked' : ''}>
      <span>${column.name}</span>
    ` // Добавляем <span> для текста

      // Событие изменения состояния чекбокса
      columnItem.querySelector('input').addEventListener('change', e => {
        const checked = e.target.checked
        if (checked) {
          columnItem.classList.add('checked') // Добавляем класс при включении
        } else {
          columnItem.classList.remove('checked') // Убираем класс при выключении
        }
      })

      container.appendChild(columnItem)
    })

    // Инициализация Sortable.js
    const sortable = new Sortable(container, {
      animation: 150,
      ghostClass: 'sortable-ghost', // Класс для элемента-призрака
      chosenClass: 'sortable-chosen', // Класс для выбранного элемента
      onStart: evt => {
        evt.item.classList.add('dragging')
      },
      onEnd: evt => {
        evt.item.classList.remove('dragging')
        updateOrder() // Обновляем порядок после завершения
      },
    })

    // Обновление порядка
    function updateOrder() {
      const items = Array.from(container.children)
      const updatedColumns = items.map(item => ({
        name: item.querySelector('span').textContent,
        visible: item.querySelector('input').checked,
      }))
      console.log('Обновленный порядок:', updatedColumns)

      // Передаем данные в main
      globalThis.electronAPI.updateColumnsOrder(updatedColumns)
    }

    // Сохранение порядка
    document.getElementById('saveColumns').addEventListener('click', () => {
      const items = Array.from(container.children)
      const result = items.map(item => ({
        name: item.querySelector('span').textContent,
        visible: item.querySelector('input').checked,
      }))
      console.log('Сохраненный порядок:', result)

      // Сохраняем через main
      globalThis.electronAPI.saveColumns(result)
    })
  }

  ///////////////////////////////////////////

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

  // Загрузка текущих настроек
  const options = await AppAPI.loadOptions()
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

  initializeTabs(tabs, sections)

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

  minimizeButton.addEventListener('click', () => AppAPI.minimizeWindow())
  closeButton.addEventListener('click', () => AppAPI.closeWindow())

  const checkboxIds = ['toggle-higlight', 'toggle-column-correct', 'toggle-column-comment', 'toggle-higlight-correct', 'toggle-switch_mode_links', 'toggle-switch_mode_links_change', 'toggle-rename-titles', 'toggle-errorRate-tab']

  const getCheckboxStates = initializeCheckboxes(checkboxIds)

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
        toggleErrorRateTab: checkboxStates['toggle-errorRate-tab'],
      }

      const selectF = await AppAPI.selectFile()
      if (selectF.error) {
        updateLog(`Ошибка: ${selectF.error}`)
        return
      }
      const filePath = selectF.filePath
      if (!filePath) {
        updateLog(`filePath отсутствует`)
        return
      }
      const ext = selectF.ext
      if (!ext) {
        updateLog(`Расширение файла отсутствует`)
        return
      }

      // show loading bar
      showElement(loadingIndicator, 'flex')

      // core process
      const processResult = await AppAPI.processFile(filePath, ext, options)

      // hide loading bar
      hideElement(loadingIndicator)

      if (processResult.error) {
        updateLog(`Ошибка: ${processResult.error}`)
        return
      } else {
        updateLog(`Файл успешно обработан`)
      }

      const resultSave = await AppAPI.saveFile(processResult.tempFilePath)

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

  function initializeCheckboxes(checkboxIds) {
    ;(async () => {
      const savedState = await AppAPI.loadCheckboxState()
      checkboxIds.forEach(id => {
        const checkbox = document.getElementById(id)
        if (checkbox) {
          checkbox.checked = savedState[id] ?? false
          checkbox.addEventListener('change', saveState)
        }
      })
    })()

    const saveState = async () => {
      const state = getCheckboxStates()
      await globalThis.electronAPI.saveCheckboxState(state)
    }

    function getCheckboxStates() {
      return checkboxIds.reduce((states, id) => {
        const checkbox = document.getElementById(id)
        if (checkbox) states[id] = checkbox.checked
        return states
      }, {})
    }

    return getCheckboxStates
  }

  function initializeTabs(tabs, sections) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab')
        toggleActiveClass(tabs, 'active', tab)
        toggleActiveClass(sections, 'active', document.getElementById(targetId))
      })
    })
  }

  function toggleActiveClass(elements, activeClass, targetElement) {
    elements.forEach(el => el.classList.remove(activeClass))
    targetElement.classList.add(activeClass)
  }

  async function renderColors(colorsContainer, highlightColors) {
    Object.entries(highlightColors).forEach(([key, value]) => {
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
    })
  }

  function showElement(element, display = 'block') {
    element.style.display = display
  }

  function hideElement(element) {
    element.style.display = 'none'
  }

  function updateLog(message) {
    const outputElement = document.getElementById('output')
    outputElement.textContent = message
    outputElement.style.display = message.trim() ? 'block' : 'none'
  }
})
