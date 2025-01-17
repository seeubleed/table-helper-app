const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),

  processFile: (filePath, options) => ipcRenderer.invoke('process-file', filePath, options),

  saveFile: tempFilePath => ipcRenderer.invoke('save-file', tempFilePath),

  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),

  saveCheckboxState: state => ipcRenderer.invoke('save-checkbox-state', state),
  loadCheckboxState: () => ipcRenderer.invoke('load-checkbox-state'),

  onUpdateAvailable: callback => ipcRenderer.on('update_available', callback),
  onUpdateDownloaded: callback => ipcRenderer.on('update_downloaded', callback),
  restartApp: () => ipcRenderer.send('restart_app'),

  loadOptions: () => ipcRenderer.invoke('load-options'),
  saveOptions: options => ipcRenderer.invoke('save-options', options),
})

contextBridge.exposeInMainWorld('appInfo', {
  getVersion: async () => {
    return await ipcRenderer.invoke('get-app-version')
  },
})
