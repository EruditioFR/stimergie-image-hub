

// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Mettez à jour ces valeurs avec vos nouvelles clés Supabase
const SUPABASE_URL = "https://mjhbugzaqmtfnbxaqpss.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qaGJ1Z3phcW10Zm5ieGFxcHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzODU2MDQsImV4cCI6MjA1Njk2MTYwNH0.JLcLHyBk3G0wO6MuhJ4WMqv8ImbGxmcExEzGG2xWIsk";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Function to create a custom fetch with retries
const fetchWithRetries = async (url: Request | string, options?: RequestInit, retries = 3, backoff = 300) => {
  try {
    const response = await fetch(url, {
      ...options,
      // Remove credentials: 'include' as it's causing CORS issues
      // Let Supabase handle the auth headers
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    
    if (response.ok) return response;
    
    if (response.status >= 500 && response.status < 600 && retries > 0) {
      console.log(`Retrying fetch due to ${response.status} error. Retries left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetries(url, options, retries - 1, backoff * 2);
    }
    
    return response;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch') && retries > 0) {
      console.log(`Network error, retrying. Retries left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetries(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
};

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'supabase-auth',
      storage: window.localStorage
    },
    global: {
      fetch: fetchWithRetries
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    }
  }
);

// Export constants for use elsewhere
export const SUPABASE_URL_PUBLIC = SUPABASE_URL;
export const SUPABASE_ANON_KEY_PUBLIC = SUPABASE_PUBLISHABLE_KEY;

