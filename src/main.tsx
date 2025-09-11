import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize unified cache system
import { unifiedCacheManager } from '@/lib/cache/UnifiedCacheManager';

// Ensure cache system is ready before rendering
const initializeApp = async () => {
  // Wait for cache system to be ready
  while (!unifiedCacheManager.isReady()) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('🚀 Unified cache system ready');
  createRoot(document.getElementById("root")!).render(<App />);
};

initializeApp();
