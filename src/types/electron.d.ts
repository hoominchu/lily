export interface ElectronAPI {
  getApiKey: () => Promise<string>;
  saveApiKey: (key: string) => Promise<boolean>;
  closeSettings: () => void;
  getScreenshotCount: () => Promise<number>;
  // onScreenshotCountUpdated: (callback: (count: number) => void) => () => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
} 