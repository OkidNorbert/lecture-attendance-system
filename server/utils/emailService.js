const nodemailer = require('nodemailer');

// Create transporter (using Gmail as an example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  // Enhanced TLS settings
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  // Pool configuration for better delivery
  pool: true,
  maxConnections: 1,
  rateDelta: 20000,
  rateLimit: 5
});

const sendWelcomeEmail = async (userEmail, tempPassword, name, role) => {
  try {
    const mailOptions = {
      from: {
        name: 'Lecture Attendance System Admin',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: 'Important: Your Lecture Attendance System Account Details',
      priority: 'high',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Lecture Attendance System</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; margin-bottom: 10px;">Welcome to Lecture Attendance System</h1>
              <p style="color: #7f8c8d;">Your Account Has Been Created</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
              <p>Dear <strong>${name}</strong>,</p>
              <p>Your account has been successfully created as a <strong>${role}</strong>. Here are your login credentials:</p>
            </div>

            <div style="background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #c8e6c9;">
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #fff; padding: 3px 6px; border-radius: 3px;">${tempPassword}</code></p>
            </div>

            <div style="background-color: #fff3e0; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
              <h3 style="color: #e64a19; margin-top: 0;">Important Security Instructions</h3>
              <ul style="padding-left: 20px; margin-bottom: 0;">
                <li>Please change your password immediately after your first login</li>
                <li>Keep your credentials confidential</li>
                <li>Never share your password with anyone</li>
                <li>Ensure you're using a secure connection when logging in</li>
              </ul>
            </div>

            <div style="margin-bottom: 20px;">
              <p><strong>Next Steps:</strong></p>
              <ol style="padding-left: 20px;">
                <li>Visit the login page</li>
                <li>Enter your email and temporary password</li>
                <li>Change your password when prompted</li>
                <li>Start using the system</li>
              </ol>
            </div>

            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 30px;">
              <p style="margin: 0; color: #666; font-size: 12px; text-align: center;">
                This is an automated message from Lecture Attendance System.<br>
                Please do not reply to this email.<br>
                If you need assistance, please contact your system administrator.
              </p>
            </div>

            <div style="margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>
                To ensure delivery, please add ${process.env.EMAIL_USER} to your contacts.<br>
                If you didn't request this account, please contact your administrator immediately.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
        'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
        'Feedback-ID': 'welcome-email:lecture-attendance-system'
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send welcome email');
  }
};

module.exports = { sendWelcomeEmail }; 