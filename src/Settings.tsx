import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

declare global {
  interface Window {
    electron: {
      getApiKey: () => Promise<string>;
      saveApiKey: (key: string) => Promise<boolean>;
      closeSettings: () => void;
      getScreenshotCount: () => Promise<number>;
    };
  }
}

const SettingsEntryPoint: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load saved API key when component mounts
    if (window.electron) {
      window.electron.getApiKey().then((key: string) => {
        setApiKey(key || '');
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      if (window.electron) {
        await window.electron.saveApiKey(apiKey);
        setMessage('API key saved successfully!');
      }
    } catch (error) {
      setMessage('Error saving API key. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (window.electron) {
      window.electron.closeSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="h-8 flex items-center justify-end drag">
        <button
          onClick={handleClose}
          className="mx-2 p-2 hover:bg-red-500 rounded-full transition-colors no-drag"
          aria-label="Close settings"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-md">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium mb-2">
              OpenAI API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="sk-..."
              required
            />
          </div>

          {message && (
            <div className={`text-sm ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save API Key'}
          </button>
        </form>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsEntryPoint />
  </React.StrictMode>
);

export default SettingsEntryPoint; 