/**
 * main.tsx
 * ─────────────────────────────────────────────────────────────────
 * Application Entry Point for "Attention Is All You Need"
 *
 * Project: AttentionIsAllYouNeed - Interactive Educational Visualizer
 * Built by: Mohammad Fayas Khan (3rd-year B.Tech CSE AI/ML student at LPU)
 *
 * Architecture:
 *   - Mounts the React 18 root onto `#root` in `index.html`.
 *   - Runs under `React.StrictMode` to catch lifecycle inconsistencies early.
 *   - Imports global styles and Apple typography tokens from `src/index.css`.
 *   - Loads KaTeX stylesheet for fast client-side mathematical equation rendering.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
