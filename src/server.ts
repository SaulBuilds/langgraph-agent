import express from 'express';
import { config } from 'dotenv';
import { google } from 'googleapis';

config();

const app = express();
const port = 3000;

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'
);

const scopes = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.send',
];

app.get('/', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent screen to always show
    include_granted_scopes: true
  });
  res.send(`<a href="${url}">Authenticate with Google</a>`);
});

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    
    if (!tokens.refresh_token) {
      res.send(`
        <h1>No refresh token received!</h1>
        <p>Please revoke access to your application at 
           <a href="https://myaccount.google.com/permissions">Google Account Permissions</a>
           and try again.</p>
        <p><a href="/">Back to start</a></p>
      `);
      return;
    }

    res.send(`
      <h1>Authentication successful!</h1>
      <p>Your refresh token is: ${tokens.refresh_token}</p>
      <p>Please save this token in your .env file as GMAIL_REFRESH_TOKEN</p>
      <pre>
GMAIL_REFRESH_TOKEN=${tokens.refresh_token}
      </pre>
    `);
  } catch (error: unknown) {
    console.error('Error getting tokens:', error);
    if (error instanceof Error) {
      res.status(500).send(`Authentication failed: ${error.message}`);
    } else {
      res.status(500).send('Authentication failed: Unknown error occurred');
    }
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Please visit http://localhost:${port} to start the OAuth flow`);
}); 