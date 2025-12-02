import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SpeedInsights as SpeedInsightsSource } from '@vercel/speed-insights/react';

// Cast SpeedInsights to any to resolve type mismatch with React 18/JSX
const SpeedInsights = SpeedInsightsSource as unknown as React.FC<any>;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
    <SpeedInsights />
  </React.StrictMode>
);