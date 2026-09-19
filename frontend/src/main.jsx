import React from "react";
import { createRoot } from "react-dom/client";
async function bootstrap() {
  const authStatus=new URLSearchParams(location.search).get('auth');
  const rawLink=location.hash.startsWith('#confirm_url=')?location.hash.slice(13):'';
  if(['confirm','complete','failed','cancelled'].includes(authStatus)){
    const Gate=(await import('./pilot/EmailLinkGate.jsx')).default;
    createRoot(document.getElementById('root')).render(<Gate status={authStatus} rawLink={rawLink}/>);
    return;
  }
  const legacy = location.pathname === '/legacy';
  const App = legacy ? (await import('./App.jsx')).App : (await import('./pilot/SwissPilot.jsx')).SwissPilot;
  if (legacy) await import('./styles.css');
  createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
}
bootstrap();
