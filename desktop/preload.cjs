const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('paperpal', {
  snapshot: () => ipcRenderer.invoke('paperpal:get'),
  act: action => ipcRenderer.invoke('paperpal:action', action),
  listen: cb => { const fn = (_, value) => cb(value); ipcRenderer.on('paperpal:update', fn); return () => ipcRenderer.removeListener('paperpal:update', fn); },
  shape: rectangles => ipcRenderer.send('paperpal:shape', rectangles),
  layout: footprints => ipcRenderer.send('paperpal:layout', footprints),
  modal: open => ipcRenderer.send('paperpal:modal', open === true),
  onConfigure: cb => { const fn = () => cb(); ipcRenderer.on('paperpal:configure', fn); return () => ipcRenderer.removeListener('paperpal:configure', fn); },
  onCollapse: cb => { const fn = () => cb(); ipcRenderer.on('paperpal:collapse', fn); return () => ipcRenderer.removeListener('paperpal:collapse', fn); },
  ready: settingsOpen => ipcRenderer.send('paperpal:ready', settingsOpen === true),
});
