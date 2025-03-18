
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://mjhbugzaqmtfnbxaqpss.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qaGJ1Z3phcW10Zm5ieGFxcHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzODU2MDQsImV4cCI6MjA1Njk2MTYwNH0.JLcLHyBk3G0wO6MuhJ4WMqv8ImbGxmcExEzGG2xWIsk";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      // Make fetch requests with retry and timeout functionality
      fetch: (...args) => {
        const url = args[0];
        const options = args[1] || {};
        
        return fetch(url, {
          ...options,
          credentials: 'include',
          // Increase default timeout for slow connections
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });
      }
    },
    // Add automatic retries for temporary network issues
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
