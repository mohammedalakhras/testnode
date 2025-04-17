const nodemailer = require("nodemailer");

const smtpTransport = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465, // الأفضل مع SSL
  secure: true, // ضروري مع المنفذ 465

  auth: {
    type: "OAuth2",
    user: process.env.GMAIL,
    // pass: process.env.GPASSWORD,

    clientId: process.env.GClientID,
    accessToken: process.env.GAccessToken,
    clientSecret: process.env.GClientSecret,
    refreshToken: process.env.GRefreshToken,
    accessToken: process.env.GAccessToken
  },
  tls: {
    rejectUnauthorized: true, // زيادة الأمان
  },
});

const fillMailBody = (req, res, user, verificationCode) => {
  //   const verificationLink = `${req.protocol}://${req.get(
  //     "host"
  //   )}/api/users/verify/${verificationCode}`;

  const mailOptions = {
    from: {
      name: "تطبيق BuyTx",
      address: process.env.GMAIL,
    },
    to: user.email,
    priority: "high", // أولوية عالية

    subject: "Email Verification - BuyTx Platform",
    text: `Hello ${user.username || "Valued User"},

Thank you for joining BuyTx. To verify your email, please use the following verification code:

${verificationCode}

This code is valid for 24 hours.
If you did not request email verification, please ignore this message.

© 2024 BuyTx. All rights reserved.
`,
    html: `<!DOCTYPE html>
  <html lang="ar" dir="rtl" layout-dir="rtl">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تأكيد البريد الإلكتروني</title>
    <style type="text/css">
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        background-color: #f5f5f5;
        -webkit-text-size-adjust: none;
        -ms-text-size-adjust: none;
       
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background-color: #ffffff;
        border: 1px solid #ddd;
      }
      .header {
        background-color: #1A472A;
        padding: 20px;
        text-align: center;
      }
      .header img {
        width: 100px;
        height: auto;
        display: block;
        margin: 0 auto;
      }
      .content {
        padding: 30px;
        color: #333333;
      }
      .content h1 {
        color: #1A472A;
        font-size: 22px;
        margin-bottom: 20px;
      }
      .content p {
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 20px;
      }
      .verification-box {
        background-color: #f8f9fa;
        border: 2px dashed #1A472A;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        margin: 20px 0;
      }
      .verification-box p {
        margin: 0;
        font-size: 16px;
        color: #555555;
      }
      .verification-code {
        font-size: 32px;
        letter-spacing: 3px;
        color: #2ECC71;
        font-weight: bold;
        margin: 15px 0;
      }
      .footer {
        background-color: #1A472A;
        padding: 20px;
        text-align: center;
        color: #ffffff;
        font-size: 12px;
      }
      .footer a {
        color: #ffffff;
        text-decoration: none;
        margin: 0 5px;
      }
    </style>
  </head>
  <body>
    <table class="container" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td class="header">
          <p> BuyTx </p>
        </td>
      </tr>
      <tr>
        <td class="content" align="">
          <h1>مرحباً ${user.username || "عميلنا الكريم"}</h1>
          <p>شكراً لانضمامك إلى منصة BuyTx. لتأكيد بريدك الإلكتروني، يرجى استخدام رمز التحقق أدناه:</p>
          <div class="verification-box">
            <p>رمز التحقق الخاص بك:</p>
            <div class="verification-code">${verificationCode}</div>
            <p>هذا الرمز صالح لمدة 24 ساعة</p>
          </div>
          <p>إذا لم تقم بطلب تأكيد البريد الإلكتروني، يرجى تجاهل هذه الرسالة.</p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p>© 2024 BuyTx. جميع الحقوق محفوظة.</p>
       
        </td>
      </tr>
    </table>
  </body>
  </html>`,
  };
  return mailOptions;
};

// <p>Please click the link below to verify your email:</p>
// <a href="${verificationLink}">Verify Email</a>
// <p>Link will expire in 24 hours</p>

const sendVerificationEmail = (mailOptions) => {
  return new Promise((resolve, reject) => {
    smtpTransport.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email Send Error:", error);
        reject(new Error("Failed to send verification email"));
      } else {
        console.log("Email Sent:", info.response);
        resolve();
      }
    });
  });
};

module.exports = {
  //   smtpTransport,
  sendVerificationEmail,
  fillMailBody,
};
