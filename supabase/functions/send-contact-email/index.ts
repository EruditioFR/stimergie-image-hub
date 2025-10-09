import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const MAILJET_API_KEY = Deno.env.get('MAILJET_API_KEY');
const MAILJET_API_SECRET = Deno.env.get('MAILJET_API_SECRET');

interface ContactEmailRequest {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, lastName, email, subject, message }: ContactEmailRequest = await req.json();

    console.log('Sending contact email from:', email);

    // Validate input
    if (!firstName || !lastName || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Tous les champs sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct HTML email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .content { padding: 20px; background-color: #ffffff; border: 1px solid #ddd; border-radius: 5px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-top: 5px; }
            .message-content { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #007bff; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0; color: #333;">Nouveau message de contact - Stimergie</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Nom complet:</div>
                <div class="value">${firstName} ${lastName}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:${email}">${email}</a></div>
              </div>
              <div class="field">
                <div class="label">Objet:</div>
                <div class="value">${subject}</div>
              </div>
              <div class="field">
                <div class="label">Message:</div>
                <div class="message-content">${message.replace(/\n/g, '<br>')}</div>
              </div>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px;">
                Envoyé le ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Plain text version
    const textContent = `
Nouveau message de contact depuis Stimergie

Nom: ${firstName} ${lastName}
Email: ${email}
Objet: ${subject}

Message:
${message}

---
Envoyé le ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}
    `.trim();

    // Send email via Mailjet
    const mailjetResponse = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${MAILJET_API_KEY}:${MAILJET_API_SECRET}`)
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: "noreply@stimergie.fr",
              Name: "Formulaire de contact Stimergie"
            },
            To: [
              {
                Email: "contact@stimergie.fr",
                Name: "Contact Stimergie"
              }
            ],
            Bcc: [
              {
                Email: "jbbejot@gmail.com"
              }
            ],
            ReplyTo: {
              Email: email,
              Name: `${firstName} ${lastName}`
            },
            Subject: `[Contact] ${subject}`,
            TextPart: textContent,
            HTMLPart: htmlContent
          }
        ]
      })
    });

    if (!mailjetResponse.ok) {
      const errorData = await mailjetResponse.text();
      console.error('Mailjet API error:', errorData);
      throw new Error(`Erreur Mailjet: ${mailjetResponse.status}`);
    }

    const result = await mailjetResponse.json();
    console.log('Email sent successfully:', result);

    return new Response(
      JSON.stringify({ success: true, message: 'Email envoyé avec succès' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in send-contact-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erreur lors de l\'envoi de l\'email',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
