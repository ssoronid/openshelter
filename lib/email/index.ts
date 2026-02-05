import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!resend) {
    console.log('📧 RESEND_API_KEY not configured, logging email instead:')
    console.log(`  To: ${to}`)
    console.log(`  Subject: ${subject}`)
    return { success: true, simulated: true }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'OpenShelter <onboarding@resend.dev>',
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Error sending email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

// Re-export templates
export * from './templates/new-application'
export * from './templates/application-approved'
export * from './templates/application-rejected'



