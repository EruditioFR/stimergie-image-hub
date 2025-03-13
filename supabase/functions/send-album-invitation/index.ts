import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Fonction pour envoyer des emails avec Mailjet
const sendMailWithMailjet = async (recipients, subject, htmlContent, textContent, customId, sender) => {
  const mailjetApiKey = Deno.env.get("MAILJET_API_KEY");
  const mailjetApiSecret = Deno.env.get("MAILJET_API_SECRET");
  
  if (!mailjetApiKey || !mailjetApiSecret) {
    throw new Error("Les clés API Mailjet ne sont pas configurées");
  }
  
  console.log(`Préparation de l'envoi d'emails à ${recipients.length} destinataires via Mailjet`);
  console.log(`Expéditeur: ${sender.Email} (${sender.Name})`);
  
  // Préparer les données pour Mailjet
  const mailjetData = {
    Messages: recipients.map(recipient => ({
      From: sender,
      To: [{ Email: recipient }],
      Subject: subject,
      TextPart: textContent,
      HTMLPart: htmlContent,
      CustomID: customId
    }))
  };

  console.log("Données Mailjet préparées:", JSON.stringify(mailjetData));

  try {
    // Envoyer la requête à l'API Mailjet
    console.log("Envoi de la requête à l'API Mailjet...");
    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(`${mailjetApiKey}:${mailjetApiSecret}`)}`
      },
      body: JSON.stringify(mailjetData)
    });

    console.log(`Réponse de l'API Mailjet: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const error = await response.json();
      console.error("Erreur Mailjet:", error);
      throw new Error(`Erreur d'envoi d'email: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log("Détails de la réponse Mailjet:", JSON.stringify(responseData));
    return responseData;
  } catch (error) {
    console.error("Exception lors de l'envoi via Mailjet:", error);
    throw error;
  }
};

const handler = async (req: Request) => {
  console.log("Fonction send-album-invitation invoquée");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.text();
    console.log(`Corps de la requête reçu: ${requestBody}`);
    
    const { albumId, albumName, shareKey, recipients, message, accessFrom, accessUntil } = JSON.parse(requestBody);

    // Valider les données reçues
    if (!albumId || !shareKey || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      console.error("Données invalides:", { albumId, shareKey, recipients });
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

    // Formater les dates pour l'affichage
    const formattedStartDate = new Date(accessFrom).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    const formattedEndDate = new Date(accessUntil).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Récupérer l'URL publique et s'assurer qu'elle n'a pas de slash à la fin
    const publicUrl = (Deno.env.get("PUBLIC_URL") || "https://votre-domaine.com").replace(/\/$/, "");

    // Construction du contenu HTML de l'email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
        <h1 style="color: #333; border-bottom: 1px solid #e1e1e1; padding-bottom: 10px;">Un album photo a été partagé avec vous</h1>
        <h2 style="color: #555;">${albumName}</h2>
        ${message ? `<p style="color: #666; font-style: italic;">"${message}"</p>` : ''}
        <p style="margin: 20px 0;">Cliquez sur le lien ci-dessous pour accéder à l'album:</p>
        <a href="${publicUrl}/shared-album/${shareKey}" 
           style="display: inline-block; background-color: #4a90e2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 10px 0;">
           Voir l'album photo
        </a>
        <p style="color: #888; margin-top: 20px; font-size: 14px;">
          Cet album est accessible du ${formattedStartDate} au ${formattedEndDate}
        </p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e1e1; color: #999; font-size: 12px;">
          <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
      </div>
    `;

    // Version texte simple de l'email
    const textContent = `
      Un album photo a été partagé avec vous: ${albumName}
      ${message ? `Message: "${message}"` : ''}
      
      Pour y accéder, visitez ce lien:
      ${publicUrl}/shared-album/${shareKey}
      
      Cet album est accessible du ${formattedStartDate} au ${formattedEndDate}
    `;

    // Configuration de l'expéditeur avec l'adresse email demandée
    const sender = {
      Email: "contact@stimergie.fr",
      Name: "Galerie Photos Stimergie"
    };

    console.log("Vérification de la variable d'environnement PUBLIC_URL:", Deno.env.get("PUBLIC_URL"));

    // Envoi des emails avec Mailjet
    try {
      const mailjetResponse = await sendMailWithMailjet(
        recipients,
        `Album photo partagé avec vous: ${albumName}`,
        htmlContent,
        textContent,
        `album-invitation-${albumId}`,
        sender
      );
      
      console.log("Emails envoyés avec succès via Mailjet:", mailjetResponse);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Invitations envoyées avec succès",
          details: mailjetResponse 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } catch (emailError) {
      console.error("Erreur lors de l'envoi des emails:", emailError);
      return new Response(
        JSON.stringify({ error: emailError.message || "Erreur lors de l'envoi des emails" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
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
