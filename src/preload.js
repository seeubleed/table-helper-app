const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),

  processFile: (filePath, ext, options) => ipcRenderer.invoke('process-file', filePath, ext, options),

  saveFile: tempFilePath => ipcRenderer.invoke('save-file', tempFilePath),

  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),

  saveCheckboxState: state => ipcRenderer.invoke('save-checkbox-state', state),
  loadCheckboxState: () => ipcRenderer.invoke('load-checkbox-state'),

  onUpdateAvailable: callback => ipcRenderer.on('update_available', callback),
  onUpdateProgress: callback => ipcRenderer.on('update-progress', (event, progress) => callback(progress)),
  onUpdateDownloaded: callback => ipcRenderer.on('update_downloaded', callback),
  restartApp: () => ipcRenderer.send('restart_app'),

  loadOptions: () => ipcRenderer.invoke('load-options'),
  saveOptions: options => ipcRenderer.invoke('save-options', options),

  loadSettings: async () => await ipcRenderer.invoke('load-settings'),
  saveSettings: async settings => await ipcRenderer.invoke('save-settings', settings),

  loadColumns: () => ipcRenderer.invoke('load-columns'),
  updateColumnsOrder: data => ipcRenderer.invoke('update-columns-order', data),
  saveColumns: data => ipcRenderer.invoke('save-columns', data),
})

contextBridge.exposeInMainWorld('appInfo', {
  getVersion: async () => {
    return await ipcRenderer.invoke('get-app-version')
  },
})
