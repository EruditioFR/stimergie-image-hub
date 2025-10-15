
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    // Create supabase admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get request body
    const { email, password, firstName, lastName, role, clientIds } = await req.json();

    // Validate inputs
    if (!email || !password || !firstName || !lastName || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // === Vérification des permissions du caller ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Non authentifié" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Créer un client Supabase avec le token du caller
    const supabaseUser = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Vérifier l'identité du caller
    const { data: { user: callerUser }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !callerUser) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Token invalide" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("User creating account:", callerUser.id);

    // Vérifier les rôles du caller
    const { data: callerRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id);

    console.log("Caller roles:", callerRoles);

    const isAdmin = callerRoles?.some(r => r.role === 'admin');
    const isAdminClient = callerRoles?.some(r => r.role === 'admin_client');

    if (!isAdmin && !isAdminClient) {
      console.error("Insufficient permissions");
      return new Response(
        JSON.stringify({ error: "Permissions insuffisantes" }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Si admin_client: vérifications supplémentaires
    if (isAdminClient && !isAdmin) {
      console.log("Admin client creating user - applying restrictions");
      
      // 1. Vérifier que le rôle créé est uniquement "user"
      if (role !== 'user') {
        console.error("Admin client trying to create non-user role:", role);
        return new Response(
          JSON.stringify({ error: "Les admin clients ne peuvent créer que des utilisateurs de type 'user'" }),
          { 
            status: 403, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      // 2. Récupérer les client_ids de l'admin_client
      const { data: callerProfile } = await supabaseAdmin
        .from('profiles')
        .select('id_client, client_ids')
        .eq('id', callerUser.id)
        .single();
      
      let callerClientIds: string[] = [];
      if (callerProfile?.client_ids && callerProfile.client_ids.length > 0) {
        callerClientIds = callerProfile.client_ids;
      } else if (callerProfile?.id_client) {
        callerClientIds = [callerProfile.id_client];
      }
      
      console.log("Admin client's authorized clients:", callerClientIds);
      
      if (callerClientIds.length === 0) {
        console.error("Admin client has no associated clients");
        return new Response(
          JSON.stringify({ error: "Admin client sans client associé" }),
          { 
            status: 403, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      // 3. Vérifier que TOUS les clientIds du nouvel utilisateur appartiennent à l'admin_client
      const requestedClientIds = clientIds || [];
      if (requestedClientIds.length === 0) {
        console.error("No clients specified for new user");
        return new Response(
          JSON.stringify({ error: "Vous devez associer l'utilisateur à au moins un client" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      console.log("Requested client IDs for new user:", requestedClientIds);
      
      const allClientsAllowed = requestedClientIds.every(cId => callerClientIds.includes(cId));
      if (!allClientsAllowed) {
        console.error("Admin client trying to assign unauthorized clients");
        return new Response(
          JSON.stringify({ error: "Vous ne pouvez créer des utilisateurs que pour vos propres clients" }),
          { 
            status: 403, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      console.log("All client checks passed for admin_client");
    }
    // === FIN Vérification des permissions du caller ===

    // Create the user
    const { data: userData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm their email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role,
      }
    });

    if (createUserError) {
      return new Response(
        JSON.stringify({ error: createUserError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // The profile should be created via the trigger, but let's update it with additional info
    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        role,
        client_ids: clientIds || [],
      })
      .eq("id", userData.user.id);

    if (updateProfileError) {
      console.error("Error updating profile:", updateProfileError);
      // Continue anyway since the user is created
    }

    // Also insert a user_role record
    if (role) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: userData.user.id,
          role: role,
        });

      if (roleError) {
        console.error("Error inserting user role:", roleError);
        // Continue anyway since the user is created
      }
    }

    return new Response(
      JSON.stringify({ 
        id: userData.user.id, 
        email: userData.user.email,
        message: "User created successfully" 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Admin create user error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
