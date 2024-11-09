import * as ImapSimple from 'imap-simple';
import { simpleParser } from 'mailparser';
import { createGraph } from './graph';
import { OAuth2Client } from 'google-auth-library';
import type { ImapSimple as ImapSimpleType } from 'imap-simple';
import type { Config as ImapConfig } from 'imap';

export class EmailListener {
  private oauth2Client: OAuth2Client;
  private connection: ImapSimpleType | null = null;
  private config: {
    user: string;
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  };

  constructor(config: {
    user: string;
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  }) {
    this.config = config;
    this.oauth2Client = new OAuth2Client(
      config.clientId,
      config.clientSecret,
      'http://localhost:3000/oauth2callback'
    );

    this.oauth2Client.setCredentials({
      refresh_token: config.refreshToken
    });
  }

  private async getAccessToken(): Promise<string> {
    try {
      console.log('Getting access token...');
      const { token } = await this.oauth2Client.getAccessToken();
      if (!token) throw new Error('No access token received');
      console.log('Access token received');
      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  private generateXOAuth2Token(user: string, accessToken: string): string {
    return Buffer.from(
      `user=${user}\x01auth=Bearer ${accessToken}\x01\x01`
    ).toString('base64');
  }

  private async connect(): Promise<ImapSimpleType> {
    try {
      console.log('Starting IMAP connection...');
      const accessToken = await this.getAccessToken();
      const xoauth2Token = this.generateXOAuth2Token(this.config.user, accessToken);

      console.log('Connecting to Gmail IMAP server...');
      const imapConfig: ImapConfig = {
        user: this.config.user,
        password: '', // Required by type but not used with OAuth2
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        authTimeout: 30000,
        tlsOptions: { 
          rejectUnauthorized: true,
          servername: 'imap.gmail.com'
        },
        xoauth2: xoauth2Token,
        debug: console.log // Enable IMAP debug logging
      };

      console.log('IMAP Config:', {
        ...imapConfig,
        xoauth2: 'REDACTED' // Don't log the token
      });

      const connection = await ImapSimple.connect({ imap: imapConfig });
      console.log('IMAP connection established');
      
      this.connection = connection;
      return connection;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Detailed connection error:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      } else {
        console.error('Unknown error type:', error);
      }
      throw error;
    }
  }

  private async processEmail(emailText: string, from: string) {
    try {
      const graph = createGraph();
      await graph.invoke({
        message: {
          sender: from,
          message: emailText,
        }
      });
    } catch (error) {
      console.error('Error processing email through graph:', error);
    }
  }

  async listen(): Promise<void> {
    try {
      const connection = await this.connect();
      console.log('Connected to IMAP server');

      await connection.openBox('INBOX');
      
      const searchCriteria = ['UNSEEN'];
      const fetchOptions = {
        bodies: ['HEADER', 'TEXT'],
        markSeen: true
      };

      setInterval(async () => {
        try {
          const results = await connection.search(searchCriteria, fetchOptions);
          
          for (const item of results) {
            const all = item.parts.find((p: { which: string }) => p.which === 'TEXT');
            if (all?.body) {
              const email = await simpleParser(all.body);
              console.log('Processing new email from:', email.from?.text);
              
              if (email.text && email.from?.text) {
                await this.processEmail(email.text, email.from.text);
              }
            }
          }
        } catch (error: unknown) {
          console.error('Error processing emails:', error);
          
          if (error instanceof Error && 
              (error.message.includes('Invalid credentials') || 
               error.message.includes('Invalid SASL'))) {
            try {
              if (this.connection) {
                await this.connection.end();
              }
              await this.connect();
            } catch (reconnectError) {
              console.error('Failed to reconnect:', reconnectError);
            }
          }
        }
      }, 30000);

      console.log('Listening for new emails...');
    } catch (error: unknown) {
      console.error('Error connecting to IMAP:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
    }
  }
}