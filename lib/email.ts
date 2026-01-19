export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string
  subject: string
  text?: string
  html?: string
}) {
  // TODO: Replace this with your actual email sending logic (e.g., Resend, nodemailer, etc.)
  console.log('Sending email:', { to, subject, text, html });
  return { success: true };
}