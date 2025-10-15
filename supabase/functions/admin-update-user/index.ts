import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userData } = await req.json();

    console.log('Admin update user request:', { userId, userData });

    // Initialize Supabase client with service_role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check authentication of the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Authenticated user:', user.id);

    // Check caller permissions
    const { data: callerRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    console.log('Caller roles:', callerRoles);

    const isAdmin = callerRoles?.some(r => r.role === 'admin');
    const isAdminClient = callerRoles?.some(r => r.role === 'admin_client');

    if (!isAdmin && !isAdminClient) {
      console.error('Insufficient permissions');
      return new Response(JSON.stringify({ error: 'Permissions insuffisantes' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If admin_client, check they're modifying a user from their client(s)
    if (isAdminClient && !isAdmin) {
      // Récupérer les client_ids de l'admin_client (caller)
      const { data: callerProfile } = await supabaseAdmin
        .from('profiles')
        .select('id_client, client_ids')
        .eq('id', user.id)
        .single();
      
      let callerClientIds: string[] = [];
      if (callerProfile?.client_ids && callerProfile.client_ids.length > 0) {
        callerClientIds = callerProfile.client_ids;
      } else if (callerProfile?.id_client) {
        callerClientIds = [callerProfile.id_client];
      }
      
      console.log('Admin client authorized clients:', callerClientIds);
      
      // Récupérer les client_ids de l'utilisateur cible
      const { data: targetProfile } = await supabaseAdmin
        .from('profiles')
        .select('id_client, client_ids')
        .eq('id', userId)
        .single();
      
      let targetClientIds: string[] = [];
      if (targetProfile?.client_ids && targetProfile.client_ids.length > 0) {
        targetClientIds = targetProfile.client_ids;
      } else if (targetProfile?.id_client) {
        targetClientIds = [targetProfile.id_client];
      }
      
      console.log('Multi-client check:', { 
        callerClientIds, 
        targetClientIds 
      });
      
      // Vérifier qu'au moins un client en commun existe
      const hasCommonClient = targetClientIds.some(tId => callerClientIds.includes(tId));
      
      if (!hasCommonClient) {
        console.error('No common client between caller and target user');
        return new Response(JSON.stringify({ 
          error: 'Vous ne pouvez modifier que les utilisateurs associés à vos clients' 
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Vérifier que les nouveaux clientIds sont autorisés
      if (userData.clientIds && userData.clientIds.length > 0) {
        const allNewClientsAllowed = userData.clientIds.every(cId => callerClientIds.includes(cId));
        if (!allNewClientsAllowed) {
          console.error('Admin client trying to assign unauthorized clients');
          return new Response(JSON.stringify({ 
            error: 'Vous ne pouvez assigner que vos propres clients' 
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // Check if email already exists (excluding current user)
    if (userData.email) {
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', userData.email)
        .neq('id', userId)
        .maybeSingle();
      
      if (existingUser) {
        console.error('Email already exists');
        return new Response(JSON.stringify({ 
          error: 'Cet email est déjà utilisé par un autre utilisateur' 
        }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Update the profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        client_ids: userData.clientIds || []
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
      throw profileError;
    }

    console.log('Profile updated successfully');

    // Update role if provided
    if (userData.role) {
      // Delete old role
      const { error: deleteError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Role delete error:', deleteError);
        throw deleteError;
      }

      // Add new role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role: userData.role });

      if (roleError) {
        console.error('Role insert error:', roleError);
        throw roleError;
      }

      console.log('Role updated successfully:', userData.role);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
