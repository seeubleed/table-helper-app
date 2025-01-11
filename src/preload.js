const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  processFile: (filePath, toggleColumnCorrect, toggleColumnComment, toggleHiglight, toggleHighlightCorrect) => ipcRenderer.invoke('process-file', filePath, toggleColumnCorrect, toggleColumnComment, toggleHiglight, toggleHighlightCorrect),
  saveFile: tempFilePath => ipcRenderer.invoke('save-file', tempFilePath),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  saveCheckboxState: state => ipcRenderer.invoke('save-checkbox-state', state),
  loadCheckboxState: () => ipcRenderer.invoke('load-checkbox-state'),
})
