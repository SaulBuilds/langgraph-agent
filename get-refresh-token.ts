import { google } from 'googleapis';
import { config } from 'dotenv';
import * as readline from 'readline';

config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'  // Updated redirect URI
);

const scopes = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.send',
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function getRefreshToken() {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });

  console.log('Visit this URL to get the authorization code:', url);

  const code = await new Promise((resolve) => {
    rl.question('Enter the code from that page here: ', resolve);
  });

  const { tokens } = await oauth2Client.getToken(code as string);
  console.log('Refresh token:', tokens.refresh_token);
  
  rl.close();
}

getRefreshToken().catch(console.error);