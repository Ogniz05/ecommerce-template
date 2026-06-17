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
  }),

  orderStatusChanged: (order, user, newStatus) => {
    const statusInfo = {
      processing: { emoji: '⚙️', title: 'Ordine in Preparazione', msg: 'Il tuo ordine è in preparazione. Ti avviseremo quando verrà spedito.' },
      shipped:    { emoji: '🚚', title: 'Ordine Spedito!', msg: `Il tuo ordine è in viaggio!${order.tracking_number ? ` Numero tracking: <strong>${order.tracking_number}</strong>` : ''}` },
      delivered:  { emoji: '✅', title: 'Ordine Consegnato!', msg: 'Il tuo ordine è stato consegnato. Speriamo che i prodotti siano di tuo gradimento!' },
      cancelled:  { emoji: '❌', title: 'Ordine Annullato', msg: 'Il tuo ordine è stato annullato. Per assistenza contattaci.' },
    };
    const info = statusInfo[newStatus] || { emoji: '📦', title: 'Aggiornamento Ordine', msg: `Il tuo ordine è aggiornato a: ${newStatus}` };
    return {
      subject: `${info.emoji} ${info.title} - #${order.order_number} - ${FROM_NAME}`,
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; background: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #D8125B, #2C2E39); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .box { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px; margin: 20px 0; }
            .footer { background: #2C2E39; color: #aaa; padding: 20px; text-align: center; font-size: 12px; }
            .btn { display: inline-block; background: #D8125B; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>${info.emoji} ${info.title}</h1></div>
            <div class="content">
              <p>Ciao <strong>${user.first_name || 'Cliente'}</strong>,</p>
              <p>${info.msg}</p>
              <div class="box">
                <p><strong>Ordine:</strong> #${order.order_number}</p>
                <p><strong>Totale:</strong> €${parseFloat(order.total_amount).toFixed(2)}</p>
              </div>
              <a href="${process.env.CLIENT_URL}/profilo/ordini/${order.id}" class="btn">Dettagli Ordine</a>
            </div>
            <div class="footer"><p>© 2026 ${FROM_NAME}. Tutti i diritti riservati.</p></div>
          </div>
        </body></html>
      `
    };
  },

  returnApproved: (user, returnReq, order) => ({
    subject: `Rimborso Approvato - Ordine #${order.order_number} - ${FROM_NAME}`,
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .box { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px; margin: 20px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #22c55e; }
          .footer { background: #2C2E39; color: #aaa; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>✓ Rimborso Approvato</h1></div>
          <div class="content">
            <p>Ciao <strong>${user.first_name}</strong>,</p>
            <p>La tua richiesta di reso per l'ordine <strong>#${order.order_number}</strong> è stata approvata.</p>
            <div class="box">
              <p><strong>Importo rimborsato:</strong> <span class="amount">€${parseFloat(returnReq.refund_amount).toFixed(2)}</span></p>
              <p><strong>Metodo:</strong> Rimborso sulla carta originale</p>
              <p style="color:#666;font-size:13px;">I tempi di accredito dipendono dalla tua banca (generalmente 5-10 giorni lavorativi).</p>
            </div>
          </div>
          <div class="footer"><p>© 2026 ${FROM_NAME}. Tutti i diritti riservati.</p></div>
        </div>
      </body></html>
    `
  }),

  returnRejected: (user, order, adminNotes) => ({
    subject: `Aggiornamento Richiesta Reso - Ordine #${order.order_number} - ${FROM_NAME}`,
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 20px; margin: 20px 0; }
          .footer { background: #2C2E39; color: #aaa; padding: 20px; text-align: center; font-size: 12px; }
          .btn { display: inline-block; background: #D8125B; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Richiesta Reso Non Approvata</h1></div>
          <div class="content">
            <p>Ciao <strong>${user.first_name}</strong>,</p>
            <p>La tua richiesta di reso per l'ordine <strong>#${order.order_number}</strong> non è stata approvata.</p>
            ${adminNotes ? `<div class="box"><strong>Motivazione:</strong><br>${adminNotes}</div>` : ''}
            <p>Per assistenza contattaci rispondendo a questa email.</p>
            <a href="${process.env.CLIENT_URL}/contatti" class="btn">Contatta il Supporto</a>
          </div>
          <div class="footer"><p>© 2026 ${FROM_NAME}. Tutti i diritti riservati.</p></div>
        </div>
      </body></html>
    `
  }),

  newsletterCampaign: ({ heading, body, ctaText, ctaUrl }) => ({
    subject: heading,
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #D8125B, #2C2E39); color: white; padding: 32px 30px; text-align: center; }
        .content { padding: 30px; color: #333; line-height: 1.7; font-size: 15px; }
        .btn { display: inline-block; background: #D8125B; color: white; padding: 13px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; }
        .footer a { color: #888; }
      </style></head>
      <body><div class="container">
        <div class="header"><h1 style="margin:0">${heading}</h1></div>
        <div class="content">
          ${body}
          ${ctaText && ctaUrl ? `<div style="text-align:center"><a href="${ctaUrl}" class="btn">${ctaText}</a></div>` : ''}
        </div>
        <div class="footer">
          <p>© 2026 ${FROM_NAME}. Tutti i diritti riservati.</p>
          <p><a href="${process.env.CLIENT_URL}">Visita il sito</a> · Per disiscriverti rispondi a questa email</p>
        </div>
      </div></body></html>
    `
  }),

  giftCard: ({ code, amount, message }) => ({
    subject: `Hai ricevuto una Gift Card da €${amount} - ${FROM_NAME}`,
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #D8125B, #7c3aed); color: white; padding: 40px 30px; text-align: center; }
        .card { margin: 24px; padding: 28px; border-radius: 16px; background: linear-gradient(135deg, #2C2E39, #4a4d5e); color: white; text-align: center; }
        .code { font-family: monospace; font-size: 24px; letter-spacing: 3px; font-weight: bold; margin: 16px 0; }
        .amount { font-size: 42px; font-weight: bold; }
        .content { padding: 0 30px 30px; }
        .btn { display: inline-block; background: #D8125B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; }
      </style></head>
      <body><div class="container">
        <div class="header"><h1>🎁 Una Gift Card per Te!</h1></div>
        <div class="card">
          <p style="margin:0;opacity:0.7">Valore</p>
          <div class="amount">€${amount}</div>
          <p style="margin:8px 0 0;opacity:0.7">Codice</p>
          <div class="code">${code}</div>
        </div>
        <div class="content">
          ${message ? `<p style="font-style:italic;color:#555;text-align:center">"${message}"</p>` : ''}
          <p>Usa questo codice al checkout per scalare l'importo dal tuo ordine. Valida 1 anno.</p>
          <div style="text-align:center"><a href="${process.env.CLIENT_URL}/catalogo" class="btn">Inizia lo Shopping</a></div>
        </div>
        <div class="footer"><p>© 2026 ${FROM_NAME}. Tutti i diritti riservati.</p></div>
      </div></body></html>
    `
  }),

  stockAlert: (product, email) => ({
    subject: `Prodotto di nuovo disponibile: ${product.name} - ${FROM_NAME}`,
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .btn { display: inline-block; background: #D8125B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; }
      </style></head>
      <body><div class="container">
        <div class="header"><h1>🟢 Di Nuovo Disponibile!</h1></div>
        <div class="content">
          <p>Ottima notizia! Un prodotto che stavi aspettando è tornato disponibile:</p>
          <h2 style="color:#111">${product.name}</h2>
          ${product.image_url ? `<img src="${product.image_url}" alt="${product.name}" style="max-width:200px;border-radius:8px;margin:10px 0">` : ''}
          <p>Affrettati — le scorte potrebbero esaurirsi presto!</p>
          <a href="${process.env.CLIENT_URL}/prodotti/${product.slug}" class="btn">Acquista Ora</a>
          <p style="font-size:12px;color:#999">Hai ricevuto questa email perché hai richiesto di essere avvisato per questo prodotto. <a href="${process.env.CLIENT_URL}/prodotti/${product.slug}">Vai al prodotto</a>.</p>
        </div>
        <div class="footer"><p>© 2026 ${FROM_NAME}. Tutti i diritti riservati.</p></div>
      </div></body></html>
    `
  }),
};

module.exports = { sendEmail, emailTemplates };
