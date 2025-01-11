const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  processFile: (filePath, toggleColumnCorrect, toggleColumnComment, toggleHiglight, toggleHighlightCorrect, toggleSwitchModeLinks, toggleSwitchModeLinksChange) =>
    ipcRenderer.invoke('process-file', filePath, toggleColumnCorrect, toggleColumnComment, toggleHiglight, toggleHighlightCorrect, toggleSwitchModeLinks, toggleSwitchModeLinksChange),
  saveFile: tempFilePath => ipcRenderer.invoke('save-file', tempFilePath),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  saveCheckboxState: state => ipcRenderer.invoke('save-checkbox-state', state),
  loadCheckboxState: () => ipcRenderer.invoke('load-checkbox-state'),
  onUpdateAvailable: callback => ipcRenderer.on('update_available', callback),
  onUpdateDownloaded: callback => ipcRenderer.on('update_downloaded', callback),
  restartApp: () => ipcRenderer.send('restart_app'),
})
