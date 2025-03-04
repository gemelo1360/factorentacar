/**
 * Email Service
 * 
 * This service handles sending emails using SendGrid API.
 * It's used for sending order confirmations and notifications.
 */

interface EmailAttachment {
  content: string;
  filename: string;
  type: string;
  disposition: string;
}

interface EmailOptions {
   to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
  cc?: string[];
}

/**
 * Send an email using SendGrid API
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    // Get SendGrid configuration from localStorage
    const apiKey = localStorage.getItem('sendgridApiKey');
    const fromEmail = localStorage.getItem('emailRemitente');
    const fromName = localStorage.getItem('nombreRemitente');
    const emailEnabled = localStorage.getItem('emailHabilitado') === 'true';
    
    // Check if email sending is enabled
    if (!emailEnabled) {
      console.log('Email sending is disabled');
      return false;
    }
    
    // Check if required configuration is available
    if (!apiKey || !fromEmail || !fromName) {
      console.error('Missing SendGrid configuration');
      return false;
    }
    
    // Prepare email data for SendGrid API
    const emailData = {
      personalizations: [
        {
          to: [{ email: options.to }],
          ...(options.cc && options.cc.length > 0 ? { cc: options.cc.map(email => ({ email })) } : {}),
          subject: options.subject,
        },
      ],
      from: {
        email: fromEmail,
        name: fromName,
      },
      content: [
        {
          type: 'text/html',
          value: options.html,
        },
      ],
      ...(options.attachments && options.attachments.length > 0
        ? { attachments: options.attachments }
        : {}),
    };
    
    // Send email using SendGrid API
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(emailData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid API error:', errorText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

/**
 * Generate HTML email template for order confirmation
 */
export const generateOrderEmailTemplate = (
  orderNumber: string,
  clientName: string,
  vehicleType: string,
  startDate: string,
  endDate: string,
  totalAmount: string,
  agentName: string = 'No especificado'
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Alquiler</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #092642;
          color: white;
          padding: 20px;
          text-align: center;
        }
        .content {
          padding: 20px;
          background-color: #f9f9f9;
        }
        .footer {
          background-color: #092642;
          color: white;
          padding: 15px;
          text-align: center;
          font-size: 12px;
        }
        .order-details {
          background-color: white;
          border: 1px solid #ddd;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        h1, h2, h3 {
          color: #092642;
        }
        .btn {
          display: inline-block;
          background-color: #092642;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Facto Rent a Car</h1>
          <p>Confirmación de Alquiler</p>
        </div>
        
        <div class="content">
          <h2>¡Gracias por su reserva!</h2>
          <p>Estimado(a) <strong>${clientName}</strong>,</p>
          <p>Su alquiler ha sido registrado exitosamente. A continuación, encontrará los detalles de su reserva:</p>
          
          <div class="order-details">
            <h3>Detalles del Alquiler</h3>
            <p><strong>Número de Orden:</strong> ${orderNumber}</p>
            <p><strong>Vehículo:</strong> ${vehicleType}</p>
            <p><strong>Fecha de Inicio:</strong> ${startDate}</p>
            <p><strong>Fecha de Fin:</strong> ${endDate}</p>
            <p><strong>Monto Total:</strong> ${totalAmount}</p>
            <p><strong>Agente que entrega:</strong> ${agentName}</p>
          </div>
          
          <p>Adjunto a este correo encontrará el contrato de alquiler en formato PDF.</p>
          <p>Si tiene alguna pregunta o necesita realizar cambios en su reserva, no dude en contactarnos.</p>
          
          <p>¡Esperamos que disfrute de su experiencia con Facto Rent a Car!</p>
        </div>
        
        <div class="footer">
          <p>Facto Rent a Car</p>
          <p>Tel: 4070-0485 | www.factorentacar.com</p>
          <p>San Ramón, Alajuela, Costa Rica</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (
  clientEmail: string,
  clientName: string,
  orderNumber: string,
  vehicleType: string,
  startDate: string,
  endDate: string,
  totalAmount: string,
  agentName: string,
  agentEmail: string,
  pdfAttachment?: string
): Promise<boolean> => {
  try {
    // Get admin email from localStorage
    const adminEmail = localStorage.getItem('emailAdmin') || 'ronaldrojascastro@gmail.com';
    
    // Create CC list with admin and agent emails
    const ccList = [adminEmail];
    if (agentEmail && agentEmail !== adminEmail) {
      ccList.push(agentEmail);
    }
    
    // Generate email HTML
    const emailHtml = generateOrderEmailTemplate(
      orderNumber,
      clientName,
      vehicleType,
      startDate,
      endDate,
      totalAmount,
      agentName
    );
    
    // Prepare email options
    const emailOptions: EmailOptions = {
      to: clientEmail,
      subject: `Confirmación de Alquiler - Facto Rent a Car - ${orderNumber}`,
      html: emailHtml,
      cc: ccList
    };
    
    // Add PDF attachment if provided
    if (pdfAttachment) {
      emailOptions.attachments = [
        {
          content: pdfAttachment.split(',')[1], // Remove data:application/pdf;base64, prefix
          filename: `Contrato_${orderNumber}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment'
        }
      ];
    }
    
    // Send email
    return await sendEmail(emailOptions);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
};