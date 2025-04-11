
// This function will be called every X minutes via Supabase Cron Jobs
// It triggers the process-queue function to handle pending download requests

// Import necessary libraries
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define constants with fallback values for local development
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://mjhbugzaqmtfnbxaqpss.supabase.co';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qaGJ1Z3phcW10Zm5ieGFxcHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzODU2MDQsImV4cCI6MjA1Njk2MTYwNH0.JLcLHyBk3G0wO6MuhJ4WMqv8ImbGxmcExEzGG2xWIsk';
const PROCESS_CONFIG = {
  max_batch_size: 2, // Reduce batch size to avoid resource limits
  processing_timeout_seconds: 300, // Reduce timeout to 5 minutes
};

// Handle the cron job request more efficiently
serve(async (_req) => {
  try {
    console.log('🕒 Starting scheduled ZIP queue processing job');
    
    // Use signal to abort fetch if it takes too long
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
    
    try {
      // Call the process-queue function with the signal
      const response = await fetch(`${SUPABASE_URL}/functions/v1/process-queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`
        },
        body: JSON.stringify(PROCESS_CONFIG),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (err) {
          errorText = 'Could not read error response';
        }
        
        // Handle specific errors
        if (response.status === 546 && errorText.includes('WORKER_LIMIT')) {
          console.log('⚠️ Worker resource limit reached, will retry on next cron cycle');
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Function resource limit reached, scheduled to retry on next cycle',
            }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        throw new Error(`Failed to trigger process-queue: ${response.status} - ${errorText}`);
      }
      
      let result;
      try {
        result = await response.json();
      } catch (err) {
        console.log('Response was not JSON, but the request succeeded:', await response.text());
        result = { message: 'Non-JSON response received but request was successful' };
      }
      
      console.log('⚡ ZIP queue processing job completed successfully:', result);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'ZIP queue processing job completed successfully',
          data: result 
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Check if the error was due to the timeout we set
      if (error.name === 'AbortError') {
        console.log('⏱️ Request timed out, will retry on next cron cycle');
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Request timed out, will retry on next cron cycle' 
          }),
          { status: 408, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      throw error;
    }
  } catch (error) {
    console.error('❌ Error in cron job:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
