import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

// Use custom domain in production, or Resend's test domain in development
// To use a custom domain, verify it at https://resend.com/domains
export const defaultFrom = process.env.RESEND_FROM_EMAIL || "DanceOne Onboarding <onboarding@resend.dev>";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    console.log("Sending email to:", to);
    console.log("From:", defaultFrom);
    console.log("API Key exists:", !!process.env.RESEND_API_KEY);
    
    const { data, error } = await resend.emails.send({
      from: defaultFrom,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend API Error:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

export default resend;

