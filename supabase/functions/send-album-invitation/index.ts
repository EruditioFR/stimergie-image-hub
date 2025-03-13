
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Cette fonction servirait à envoyer un email avec le lien de partage
// Dans une implémentation complète, utilisez un service d'email comme Resend, SendGrid, etc.
const handler = async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { albumId, albumName, shareKey, recipients, message, accessFrom, accessUntil } = await req.json();

    // Valider les données reçues
    if (!albumId || !shareKey || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "Données invalides" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Envoi d'invitation pour l'album ${albumId} (${albumName}) avec la clé ${shareKey}`);
    console.log(`Destinataires: ${recipients.join(", ")}`);
    console.log(`Message: ${message || "Aucun message"}`);
    console.log(`Accessible du ${accessFrom} au ${accessUntil}`);

    // Ici, implémentez l'envoi d'emails avec un service comme Resend
    // Pour chaque destinataire dans le tableau recipients
    
    // Dans une vraie implémentation, vous auriez un code comme celui-ci:
    /*
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    for (const recipient of recipients) {
      await resend.emails.send({
        from: 'Photo Gallery <noreply@yourdomain.com>',
        to: recipient,
        subject: `${albumName} - Album photo partagé avec vous`,
        html: `
          <h1>Un album photo a été partagé avec vous</h1>
          <p>${message || ""}</p>
          <p>Cliquez sur le lien ci-dessous pour accéder à l'album:</p>
          <p><a href="https://yourdomain.com/shared-album/${shareKey}">Voir l'album ${albumName}</a></p>
          <p>Cet album est accessible du ${new Date(accessFrom).toLocaleDateString()} au ${new Date(accessUntil).toLocaleDateString()}</p>
        `,
      });
    }
    */

    // Pour l'instant, simulons une réponse réussie
    return new Response(
      JSON.stringify({ success: true, message: "Invitations envoyées avec succès" }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Erreur dans send-album-invitation:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Une erreur est survenue" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);
