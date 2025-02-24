import React from 'react';

const App: React.FC = () => {
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
          className="mx-2 p-2 hover:bg-red-500 rounded-full transition-colors"
          aria-label="Close application"
        >
          <svg
            className="w-3 h-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to My Mac App</h1>
        <p className="text-gray-300">
          This is a native-looking Mac application built with Electron and React.
        </p>
      </div>
    </div>
  );
};

export default App; 