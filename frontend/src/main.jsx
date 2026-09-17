import React from "react";
import { createRoot } from "react-dom/client";
async function bootstrap() {
  const legacy = location.pathname === '/legacy';
  const App = legacy ? (await import('./App.jsx')).App : (await import('./pilot/SwissPilot.jsx')).SwissPilot;
  if (legacy) await import('./styles.css');
  createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
}
bootstrap();
