import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('🚀 Main: Starting Ripl application...');

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('❌ Main: Root element not found!');
  throw new Error('Root element not found');
}

console.log('✅ Main: Root element found, creating React root...');
const root = createRoot(rootElement);

try {
  root.render(<App />);
  console.log('✅ Main: App rendered successfully');
} catch (error) {
  console.error('❌ Main: Error rendering app:', error);
}