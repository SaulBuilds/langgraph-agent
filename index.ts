import { config } from 'dotenv';
import { EmailService, type EmailConfig } from "./email";
import { EmailListener } from "./email-listener";

// Load environment variables
config();

// Validate environment variables
const requiredEnvVars = [
  'EMAIL_USER',
  'GMAIL_CLIENT_ID',
  'GMAIL_CLIENT_SECRET',
  'GMAIL_REFRESH_TOKEN'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Configure email service
const emailConfig: EmailConfig = {
  auth: {
    user: process.env.EMAIL_USER!,
    clientId: process.env.GMAIL_CLIENT_ID!,
    clientSecret: process.env.GMAIL_CLIENT_SECRET!,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN!,
  }
};

// Initialize services
export const emailService = new EmailService(emailConfig);

const emailListener = new EmailListener({
  user: process.env.EMAIL_USER!,
  clientId: process.env.GMAIL_CLIENT_ID!,
  clientSecret: process.env.GMAIL_CLIENT_SECRET!,
  refreshToken: process.env.GMAIL_REFRESH_TOKEN!
});

// Start listening for emails
emailListener.listen()
  .then(() => console.log('Email listener started'))
  .catch(console.error);

// Cleanup on exit
process.on('SIGINT', async () => {
  console.log('Stopping email listener...');
  await emailListener.stop();
  process.exit(0);
});