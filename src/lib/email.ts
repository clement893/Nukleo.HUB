// Utilitaire d'envoi d'emails avec SendGrid
const sgMail = require("@sendgrid/mail");

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@nukleo.com";
const FROM_NAME = process.env.FROM_NAME || "Nukleo.HUB";

// Initialiser SendGrid si la clé API est disponible
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn("SENDGRID_API_KEY not configured, skipping email send");
    return false;
  }

  try {
    const msg = {
      to: options.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
      html: options.html,
    };

    await sgMail.send(msg);
    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error("Error sending email with SendGrid:", error);
    return false;
  }
}

// Template d'email d'invitation
export function getInvitationEmailHtml(params: {
  inviterName: string;
  inviteeEmail: string;
  role: string;
  invitationLink: string;
  expiresAt: Date;
}): string {
  const roleLabels: Record<string, string> = {
    super_admin: "Super Administrateur",
    admin: "Administrateur",
    user: "Utilisateur",
  };

  const expiresFormatted = params.expiresAt.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation Nukleo.HUB</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff;">
                Nukleo<span style="color: #3b82f6;">.HUB</span>
              </h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #1e293b; border-radius: 16px; padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; color: #ffffff; text-align: center;">
                Vous êtes invité ! 🎉
              </h2>
              
              <p style="margin: 0 0 20px; font-size: 16px; color: #94a3b8; line-height: 1.6;">
                <strong style="color: #ffffff;">${params.inviterName}</strong> vous invite à rejoindre Nukleo.HUB en tant que <strong style="color: #3b82f6;">${roleLabels[params.role] || params.role}</strong>.
              </p>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td style="background-color: #0f172a; border-radius: 12px; padding: 20px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email</td>
                        <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">${params.inviteeEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Rôle</td>
                        <td style="padding: 8px 0; color: #3b82f6; font-size: 14px; text-align: right;">${roleLabels[params.role] || params.role}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Expire le</td>
                        <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">${expiresFormatted}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${params.invitationLink}" style="display: inline-block; padding: 16px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                      Accepter l'invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; font-size: 14px; color: #64748b; text-align: center;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                <a href="${params.invitationLink}" style="color: #3b82f6; word-break: break-all;">${params.invitationLink}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 30px;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                © ${new Date().getFullYear()} Nukleo. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getInvitationEmailText(params: {
  inviterName: string;
  inviteeEmail: string;
  role: string;
  invitationLink: string;
  expiresAt: Date;
}): string {
  const roleLabels: Record<string, string> = {
    super_admin: "Super Administrateur",
    admin: "Administrateur",
    user: "Utilisateur",
  };

  const expiresFormatted = params.expiresAt.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return `
Vous êtes invité à rejoindre Nukleo.HUB !

${params.inviterName} vous invite à rejoindre Nukleo.HUB en tant que ${roleLabels[params.role] || params.role}.

Détails :
- Email : ${params.inviteeEmail}
- Rôle : ${roleLabels[params.role] || params.role}
- Expire le : ${expiresFormatted}

Pour accepter l'invitation, cliquez sur ce lien :
${params.invitationLink}

© ${new Date().getFullYear()} Nukleo. Tous droits réservés.
  `.trim();
}

// Template d'email de notification (pour les notifications générales)
export function getNotificationEmailHtml(params: {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff;">
                Nukleo<span style="color: #3b82f6;">.HUB</span>
              </h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #1e293b; border-radius: 16px; padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; color: #ffffff; text-align: center;">
                ${params.title}
              </h2>
              
              <p style="margin: 0 0 20px; font-size: 16px; color: #94a3b8; line-height: 1.6;">
                ${params.message}
              </p>
              
              ${params.actionUrl ? `
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${params.actionUrl}" style="display: inline-block; padding: 16px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                      ${params.actionText || "Voir plus"}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 30px;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                © ${new Date().getFullYear()} Nukleo. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getNotificationEmailText(params: {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}): string {
  return `
${params.title}

${params.message}

${params.actionUrl ? `${params.actionText || "Voir plus"}: ${params.actionUrl}` : ''}

© ${new Date().getFullYear()} Nukleo. Tous droits réservés.
  `.trim();
}
