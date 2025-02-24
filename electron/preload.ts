import { contextBridge, ipcRenderer } from 'electron';

// Explicitly type the electron handler
const electronHandler = {
  closeSettings: () => ipcRenderer.send('close-settings'),
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  saveApiKey: (key: string) => ipcRenderer.invoke('save-api-key', key),
  getScreenshotCount: async () => {
    try {
      return await ipcRenderer.invoke('get-screenshot-count');
    } catch (error) {
      console.error('Error getting screenshot count:', error);
      return 0;
    }
  },
  clearAppData: () => ipcRenderer.invoke('clear-app-data'),
};

contextBridge.exposeInMainWorld('electron', electronHandler); 