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
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.insert'
  ];

app.get('/', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  res.send(`<a href="${url}">Authenticate with Google</a>`);
});

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    res.send(`
      <h1>Authentication successful!</h1>
      <p>Your refresh token is: ${tokens.refresh_token}</p>
      <p>Please save this token in your .env file as GMAIL_REFRESH_TOKEN</p>
    `);
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).send('Authentication failed');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});