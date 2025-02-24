import React from 'react';
import ReactDOM from 'react-dom/client';
import SettingsWindow from './SettingsWindow';
import './renderer/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsWindow />
  </React.StrictMode>
); 