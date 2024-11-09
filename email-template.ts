export class EmailTemplate {
    static getEmailSignature() {
      return `
        <div style="font-family: Arial, sans-serif; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 400px;">
            <tr>
              <td style="vertical-align: top; padding-right: 15px;">
                <img src="https://your-domain.com/logo.png" alt="Company Logo" style="width: 100px; height: auto;">
              </td>
              <td style="vertical-align: top;">
                <p style="margin: 0; font-weight: bold; color: #333;">Your Name</p>
                <p style="margin: 5px 0; color: #666;">Position | Company Name</p>
                <p style="margin: 0; color: #666;">📞 +1 (123) 456-7890</p>
                <p style="margin: 0; color: #666;">📧 your.email@company.com</p>
                <div style="margin-top: 10px;">
                  <a href="https://linkedin.com/in/yourprofile" style="text-decoration: none; margin-right: 10px;">
                    <img src="https://your-domain.com/linkedin.png" alt="LinkedIn" style="width: 20px; height: 20px;">
                  </a>
                  <a href="https://twitter.com/yourhandle" style="text-decoration: none;">
                    <img src="https://your-domain.com/twitter.png" alt="Twitter" style="width: 20px; height: 20px;">
                  </a>
                </div>
              </td>
            </tr>
          </table>
        </div>
      `;
    }
  
    static getEmailTemplate(subject: string, body: string) {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            ${body}
            ${this.getEmailSignature()}
          </body>
        </html>
      `;
    }
  }