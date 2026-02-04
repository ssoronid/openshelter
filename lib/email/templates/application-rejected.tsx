interface ApplicationRejectedEmailProps {
  applicantName: string
  animalName: string
  shelterName: string
  notes?: string
  websiteUrl?: string
}

export function generateApplicationRejectedEmail({
  applicantName,
  animalName,
  shelterName,
  notes,
  websiteUrl,
}: ApplicationRejectedEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Actualización sobre tu solicitud</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Actualización sobre tu solicitud</h1>
    </div>
    
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        Hola <strong>${applicantName}</strong>,
      </p>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        Gracias por tu interés en adoptar a <strong>${animalName}</strong>. Lamentamos informarte que en esta ocasión no hemos podido aprobar tu solicitud.
      </p>
      
      ${notes ? `
      <div style="background: #f8fafc; border-left: 4px solid #6b7280; padding: 16px; margin: 0 0 24px; border-radius: 0 8px 8px 0;">
        <h3 style="color: #4b5563; margin: 0 0 8px; font-size: 14px;">Mensaje del refugio:</h3>
        <p style="color: #374151; margin: 0; font-size: 15px;">${notes}</p>
      </div>
      ` : ''}
      
      <div style="background: #fef3c7; padding: 20px; margin: 0 0 24px; border-radius: 12px;">
        <h3 style="color: #92400e; margin: 0 0 12px; font-size: 16px;">💛 No te desanimes</h3>
        <p style="color: #78350f; font-size: 15px; line-height: 1.6; margin: 0;">
          Hay muchos otros animales esperando un hogar. Te invitamos a seguir buscando y a considerar adoptar a otro compañero que también necesita amor.
        </p>
      </div>
      
      ${websiteUrl ? `
      <div style="text-align: center; margin-top: 32px;">
        <a href="${websiteUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Ver otros animales en adopción
        </a>
      </div>
      ` : ''}
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 32px 0 0;">
        Gracias por considerar la adopción.<br><br>
        Con cariño,<br>
        <strong>${shelterName}</strong>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
      
      <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">
        Este email fue enviado por OpenShelter.<br>
        © ${new Date().getFullYear()} OpenShelter - Sistema de gestión para refugios
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}


