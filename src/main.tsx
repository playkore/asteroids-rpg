import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UI_LINE_WIDTH_PX } from './constants';
import './styles.css';

document.documentElement.style.setProperty('--ui-line-width', UI_LINE_WIDTH_PX);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
