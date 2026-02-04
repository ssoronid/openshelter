interface ApplicationApprovedEmailProps {
  applicantName: string
  animalName: string
  animalSpecies: string
  shelterName: string
  shelterEmail?: string
  shelterPhone?: string
  notes?: string
}

export function generateApplicationApprovedEmail({
  applicantName,
  animalName,
  animalSpecies,
  shelterName,
  shelterEmail,
  shelterPhone,
  notes,
}: ApplicationApprovedEmailProps): string {
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
  <title>¡Solicitud Aprobada!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
      <h1 style="color: white; margin: 0; font-size: 24px;">¡Felicidades! Tu solicitud fue aprobada</h1>
    </div>
    
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        ¡Hola <strong>${applicantName}</strong>!
      </p>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        Nos alegra informarte que tu solicitud de adopción para <strong>${animalName}</strong> ha sido <span style="color: #22c55e; font-weight: bold;">APROBADA</span>. 
      </p>
      
      <div style="background: #f0fdf4; border: 2px solid #22c55e; padding: 24px; margin: 0 0 24px; border-radius: 12px; text-align: center;">
        <div style="font-size: 64px; margin-bottom: 12px;">${animalSpecies === 'cat' ? '🐱' : animalSpecies === 'dog' ? '🐕' : '🐾'}</div>
        <h2 style="color: #15803d; margin: 0 0 8px; font-size: 28px;">${animalName}</h2>
        <p style="color: #16a34a; margin: 0; font-size: 14px;">${speciesLabels[animalSpecies] || animalSpecies}</p>
      </div>
      
      ${notes ? `
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 0 0 24px; border-radius: 0 8px 8px 0;">
        <h3 style="color: #b45309; margin: 0 0 8px; font-size: 14px;">Mensaje del refugio:</h3>
        <p style="color: #374151; margin: 0; font-size: 15px;">${notes}</p>
      </div>
      ` : ''}
      
      <div style="background: #f8fafc; padding: 20px; margin: 0 0 24px; border-radius: 12px;">
        <h3 style="color: #1f2937; margin: 0 0 16px; font-size: 16px;">📞 Próximos pasos</h3>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          El refugio <strong>${shelterName}</strong> se pondrá en contacto contigo para coordinar la entrega de ${animalName}.
        </p>
        
        ${(shelterEmail || shelterPhone) ? `
        <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 16px;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">También puedes contactar al refugio directamente:</p>
          ${shelterEmail ? `<p style="margin: 0 0 4px;"><a href="mailto:${shelterEmail}" style="color: #2563eb; font-size: 14px;">${shelterEmail}</a></p>` : ''}
          ${shelterPhone ? `<p style="margin: 0;"><span style="color: #374151; font-size: 14px;">${shelterPhone}</span></p>` : ''}
        </div>
        ` : ''}
      </div>
      
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; text-align: center;">
        <p style="color: #92400e; font-size: 15px; margin: 0; font-weight: 500;">
          💛 Gracias por elegir adoptar y darle una segunda oportunidad a ${animalName}
        </p>
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


