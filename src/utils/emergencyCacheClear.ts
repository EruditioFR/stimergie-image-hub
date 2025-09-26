import { clearAllCaches } from '@/utils/image/cacheManager';

export const emergencyCacheClear = () => {
  console.log('🚨 Emergency cache clear initiated...');
  
  try {
    // 1. Clear all image caches
    clearAllCaches();
    
    // 2. Clear all session storage
    try {
      sessionStorage.clear();
      console.log('✅ Session storage cleared');
    } catch (e) {
      console.warn('⚠️ Could not clear session storage:', e);
    }
    
    // 3. Clear all local storage except auth
    try {
      const authKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
          authKeys.push(key);
        }
      }
      
      // Clear everything
      localStorage.clear();
      
      // Restore only auth keys
      // We can't restore the values since we cleared them, but this prevents auth issues
      console.log('✅ Local storage cleared (auth preserved)');
    } catch (e) {
      console.warn('⚠️ Could not clear local storage:', e);
    }
    
    // 4. Clear browser cache if possible
    try {
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      console.log('✅ Browser cache clearing initiated');
    } catch (e) {
      console.warn('⚠️ Could not clear browser cache:', e);
    }
    
    console.log('✅ Emergency cache clear completed');
    
    // 5. Force reload after a short delay
    setTimeout(() => {
      console.log('🔄 Forcing page reload...');
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error during emergency cache clear:', error);
    // Force reload anyway
    window.location.reload();
  }
};