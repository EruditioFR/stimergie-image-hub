
// This function will be called every X minutes via Supabase Cron Jobs
// It triggers the process-queue function to handle pending download requests

// Import necessary libraries
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define constants
const FUNCTION_ENDPOINT = Deno.env.get('PUBLIC_URL') || 'https://mjhbugzaqmtfnbxaqpss.supabase.co';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const PROCESS_CONFIG = {
  max_batch_size: 5, // Process 5 requests at a time
  processing_timeout_seconds: 600, // Maximum processing time: 10 minutes
};

// Handle the cron job request
serve(async (_req) => {
  try {
    console.log('🕒 Starting scheduled ZIP queue processing job');
    
    // Call the process-queue function
    const response = await fetch(`${FUNCTION_ENDPOINT}/functions/v1/process-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify(PROCESS_CONFIG)
    });
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (err) {
        errorText = 'Could not read error response';
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
    console.error('❌ Error in cron job:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
