
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, newPassword } = await req.json()

    if (!userId || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'userId et newPassword sont requis' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Créer un client Supabase avec la clé service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Récupérer le token d'autorisation
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token d\'autorisation manquant' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Vérifier l'utilisateur authentifié
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token invalide' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Récupérer le profil de l'utilisateur authentifié
    const { data: currentUserProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, id_client')
      .eq('id', user.id)
      .single()

    if (profileError || !currentUserProfile) {
      return new Response(
        JSON.stringify({ error: 'Profil utilisateur non trouvé' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Vérifier les permissions
    const isAdmin = currentUserProfile.role === 'admin'
    const isAdminClient = currentUserProfile.role === 'admin_client'

    if (!isAdmin && !isAdminClient) {
      return new Response(
        JSON.stringify({ error: 'Permissions insuffisantes' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Si c'est un admin_client, vérifier qu'il peut modifier cet utilisateur
    if (isAdminClient) {
      // Récupérer les client_ids de l'admin_client (caller)
      const { data: callerProfile } = await supabaseAdmin
        .from('profiles')
        .select('id_client, client_ids')
        .eq('id', user.id)
        .single()
      
      let callerClientIds: string[] = []
      if (callerProfile?.client_ids && callerProfile.client_ids.length > 0) {
        callerClientIds = callerProfile.client_ids
      } else if (callerProfile?.id_client) {
        callerClientIds = [callerProfile.id_client]
      }
      
      // Récupérer les client_ids de l'utilisateur cible
      const { data: targetUserProfile, error: targetProfileError } = await supabaseAdmin
        .from('profiles')
        .select('id_client, client_ids')
        .eq('id', userId)
        .single()

      if (targetProfileError || !targetUserProfile) {
        return new Response(
          JSON.stringify({ error: 'Utilisateur cible non trouvé' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      let targetClientIds: string[] = []
      if (targetUserProfile.client_ids && targetUserProfile.client_ids.length > 0) {
        targetClientIds = targetUserProfile.client_ids
      } else if (targetUserProfile.id_client) {
        targetClientIds = [targetUserProfile.id_client]
      }
      
      // Vérifier qu'au moins un client en commun existe
      const hasCommonClient = targetClientIds.some(tId => callerClientIds.includes(tId))
      
      if (!hasCommonClient) {
        return new Response(
          JSON.stringify({ 
            error: 'Vous ne pouvez modifier que les utilisateurs associés à vos clients' 
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Vérifier le rôle de l'utilisateur cible
      const { data: targetUserRole } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single()

      // Un admin_client ne peut modifier que le mot de passe des utilisateurs avec le rôle 'user'
      if (targetUserRole && targetUserRole.role !== 'user') {
        return new Response(
          JSON.stringify({ 
            error: 'Vous ne pouvez modifier le mot de passe que des utilisateurs standards (non admin)' 
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Mettre à jour le mot de passe
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Erreur lors de la mise à jour du mot de passe:', updateError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la mise à jour du mot de passe: ' + updateError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Mot de passe mis à jour avec succès' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erreur inattendue:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
