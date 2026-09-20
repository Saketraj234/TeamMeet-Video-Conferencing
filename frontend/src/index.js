import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Buffer } from 'buffer';
import process from 'process';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

window.Buffer = Buffer;
window.process = process;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    if (window.confirm('New version of TeamMeet available! Click OK to update.')) {
      if (registration && registration.waiting) {
        registration.waiting.postMessage('SKIP_WAITING');
      }
      window.location.reload();
    }
  },
  onSuccess: () => {
    console.log('TeamMeet PWA ready for offline use.');
  },
});

reportWebVitals();
