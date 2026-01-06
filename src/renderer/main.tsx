import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Ensure shadowAPI is available - import it synchronously
import { shadowAPI } from './shadowAPI';
if (!window.shadowAPI) {
    (window as any).shadowAPI = shadowAPI;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
