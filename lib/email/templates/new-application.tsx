interface NewApplicationEmailProps {
  applicantName: string
  applicantEmail: string
  applicantPhone: string
  animalName: string
  animalSpecies: string
  reason?: string
  shelterName: string
  dashboardUrl: string
}

export function generateNewApplicationEmail({
  applicantName,
  applicantEmail,
  applicantPhone,
  animalName,
  animalSpecies,
  reason,
  shelterName,
  dashboardUrl,
}: NewApplicationEmailProps): string {
  const speciesLabels: Record<string, string> = {
    dog: '🐕 Perro',
    cat: '🐱 Gato',
    other: '🐾 Otro',
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Solicitud de Adopción</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">🐾 Nueva Solicitud de Adopción</h1>
    </div>
    
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        ¡Hola <strong>${shelterName}</strong>!
      </p>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        Has recibido una nueva solicitud de adopción para <strong>${animalName}</strong>.
      </p>
      
      <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 16px; margin: 0 0 24px; border-radius: 0 8px 8px 0;">
        <h3 style="color: #c2410c; margin: 0 0 12px; font-size: 14px; text-transform: uppercase;">Datos del Animal</h3>
        <p style="color: #374151; margin: 0; font-size: 15px;">
          <strong>Nombre:</strong> ${animalName}<br>
          <strong>Especie:</strong> ${speciesLabels[animalSpecies] || animalSpecies}
        </p>
      </div>
      
      <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 0 0 24px; border-radius: 0 8px 8px 0;">
        <h3 style="color: #15803d; margin: 0 0 12px; font-size: 14px; text-transform: uppercase;">Datos del Solicitante</h3>
        <p style="color: #374151; margin: 0; font-size: 15px;">
          <strong>Nombre:</strong> ${applicantName}<br>
          <strong>Email:</strong> <a href="mailto:${applicantEmail}" style="color: #2563eb;">${applicantEmail}</a><br>
          <strong>Teléfono:</strong> ${applicantPhone}
        </p>
      </div>
      
      ${reason ? `
      <div style="background: #f8fafc; padding: 16px; margin: 0 0 24px; border-radius: 8px;">
        <h3 style="color: #475569; margin: 0 0 8px; font-size: 14px;">Razón para adoptar:</h3>
        <p style="color: #374151; margin: 0; font-size: 15px; font-style: italic;">"${reason}"</p>
      </div>
      ` : ''}
      
      <div style="text-align: center; margin-top: 32px;">
        <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Ver Solicitud en Dashboard
        </a>
      </div>
      
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



