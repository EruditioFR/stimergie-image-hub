import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { emergencyCacheClear } from '@/utils/emergencyCacheClear'

// Emergency cache clear to fix RLS recursion issues
console.log('🚨 Clearing all caches due to RLS policy issues...');
emergencyCacheClear();
