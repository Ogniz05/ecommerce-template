const nodemailer = require('nodemailer');
require('dotenv').config();

// [CUSTOMIZE] Update email sender name to your company name
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'YOUR NAME Store';
const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'noreply@yourcompany.com';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
      to,
      subject,
      html,
      text: text || ''
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  orderConfirmation: (order, user) => ({
    subject: `Conferma Ordine #${order.order_number} - ${FROM_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #D8125B, #2C2E39); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .order-box { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px; margin: 20px 0; }
          .total { font-size: 20px; font-weight: bold; color: #D8125B; }
          .footer { background: #2C2E39; color: #aaa; padding: 20px; text-align: center; font-size: 12px; }
          .btn { display: inline-block; background: #D8125B; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <!-- [CUSTOMIZE] Insert your company logo here -->
            <h1>${FROM_NAME}</h1>
            <p>Grazie per il tuo ordine!</p>
          </div>
          <div class="content">
            <p>Ciao <strong>${user.first_name}</strong>,</p>
            <p>Il tuo ordine è stato confermato e verrà elaborato al più presto.</p>
            <div class="order-box">
              <h3>Riepilogo Ordine</h3>
              <p><strong>Numero Ordine:</strong> ${order.order_number}</p>
              <p><strong>Data:</strong> ${new Date(order.created_at).toLocaleDateString('it-IT')}</p>
              <p><strong>Stato:</strong> In elaborazione</p>
              <p class="total"><strong>Totale: €${parseFloat(order.total_amount).toFixed(2)}</strong></p>
            </div>
            <a href="${process.env.CLIENT_URL}/orders/${order.id}" class="btn">Traccia il tuo ordine</a>
          </div>
          <div class="footer">
            <!-- [CUSTOMIZE] Update copyright with your company name and year -->
            <p>© 2026 ${FROM_NAME}. Tutti i diritti riservati.</p>
            <!-- [CUSTOMIZE] Add your company address in footer -->
            <p>Via Roma 1, 20100 Milano, Italia</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  passwordReset: (user, resetUrl) => ({
    subject: `Reset Password - ${FROM_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #D8125B, #2C2E39); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .btn { display: inline-block; background: #D8125B; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
          .footer { background: #2C2E39; color: #aaa; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Reset Password</h1></div>
          <div class="content">
            <p>Ciao <strong>${user.first_name}</strong>,</p>
            <p>Hai richiesto il reset della tua password. Clicca il pulsante qui sotto:</p>
            <a href="${resetUrl}" class="btn">Reset Password</a>
            <p style="margin-top:20px;color:#666;font-size:12px;">Questo link scade tra 1 ora. Se non hai richiesto il reset, ignora questa email.</p>
          </div>
          <div class="footer"><p>© 2026 ${FROM_NAME}</p></div>
        </div>
      </body>
      </html>
    `
  }),

  emailVerification: (user, verifyUrl) => ({
    subject: `Verifica Email - ${FROM_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #D8125B, #2C2E39); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .btn { display: inline-block; background: #D8125B; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; }
          .footer { background: #2C2E39; color: #aaa; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Benvenuto in ${FROM_NAME}!</h1></div>
          <div class="content">
            <p>Ciao <strong>${user.first_name}</strong>,</p>
            <p>Verifica il tuo indirizzo email per completare la registrazione:</p>
            <a href="${verifyUrl}" class="btn">Verifica Email</a>
          </div>
          <div class="footer"><p>© 2026 ${FROM_NAME}</p></div>
        </div>
      </body>
      </html>
    `
  })
};

module.exports = { sendEmail, emailTemplates };
