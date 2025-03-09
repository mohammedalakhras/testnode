const nodemailer = require("nodemailer");

const smtpTransport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.GMAIL,
    pass: process.env.GPASSWORD,
  },
});

const fillMailBody = (req, res, user, verificationCode) => {
  //   const verificationLink = `${req.protocol}://${req.get(
  //     "host"
  //   )}/api/users/verify/${verificationCode}`;
  const mailOptions = {
    to: user.email,
    subject: "مرابح - تأكيد البريد الإلكتروني",
    html: `
    <!DOCTYPE html>
    <html lang="ar">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>مرابح - تأكيد البريد الإلكتروني</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #0A0A0A;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #E0E0E0;
          direction: rtl;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #1A1A1A;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        .header {
          background: linear-gradient(135deg, #1A472A 0%, #2ECC71 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .logo {
          width: 120px;
          margin-bottom: 20px;
        }
        .title {
          font-size: 28px;
          color: #FFFFFF;
          margin: 10px 0;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 20px;
          color: #2ECC71;
          margin-bottom: 25px;
        }
        .verification-box {
          background: #252525;
          border: 1px solid #2ECC71;
          border-radius: 12px;
          padding: 25px;
          margin: 30px 0;
          text-align: center;
        }
        .verification-code {
          font-size: 32px;
          letter-spacing: 4px;
          color: #2ECC71;
          margin: 15px 0;
          font-weight: 700;
        }
        .features {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin: 30px 0;
        }
        .feature-item {
          background: #252525;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .icon {
          width: 40px;
          margin-bottom: 10px;
        }
        .footer {
          background: #121212;
          padding: 30px;
          text-align: center;
          font-size: 14px;
          color: #888888;
        }
        .social-links a {
          margin: 0 10px;
          text-decoration: none;
          color: #2ECC71 !important;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${
            // <p>Please click the link below to verify your email:</p>
            // <a href="${verificationLink}">Verify Email</a>
            // <p>Link will expire in 24 hours</p>
            ""
          }
          <img src="../../assets/images/logo.jpg" class="logo" alt="شعار مرابح"/>
          <h1 class="title">مرحبا بك في مرابح</h1>
        </div>

        <div class="content">
          <div class="greeting">عزيزي ${user.username || "المستخدم"}،</div>
          
          <p>نشكرك لانضمامك إلى أكبر منصة للإعلانات المبوبة في المنطقة!</p>
          
          <div class="verification-box">
            <p>رمز التحقق الخاص بك:</p>
            <div class="verification-code">${verificationCode}</div>
            <p>صلاحية الرمز: 24 ساعة</p>
          </div>

          <div class="features">
            <div class="feature-item">
              <img src="https://cdn-icons-png.flaticon.com/512/891/891462.png" class="icon" alt="sell icon"/>
              <h3>بيع منتجاتك بسهولة</h3>
              <p>أضف إعلاناتك مع صور عالية الجودة</p>
            </div>
            <div class="feature-item">
              <img src="https://cdn-icons-png.flaticon.com/512/891/891390.png" class="icon" alt="buy icon"/>
              <h3>اشتري بثقة</h3>
              <p>تواصل مباشر مع البائعين المعتمدين</p>
            </div>
          </div>

          <p>✨ ميزات مرابح:</p>
          <ul style="line-height: 1.8; padding-right: 20px;">
            <li>حماية متقدمة من الاحتيال</li>
            <li>دعم فني على مدار الساعة</li>
            <li>تصنيفات مفصلة لكل المنتجات</li>
            <li>نظام تقييم للمستخدمين</li>
          </ul>
        </div>

        <div class="footer">
          <div class="social-links">
            <a href="https://twitter.com/murabah_app">تويتر</a>
            <a href="https://instagram.com/murabah_app">إنستغرام</a>
            <a href="https://murabah.com/support">الدعم الفني</a>
          </div>
          <p style="margin-top: 20px;">
            هذه الرسالة أرسلت تلقائياً، الرجاء عدم الرد<br>
            © 2024 مرابح. جميع الحقوق محفوظة
          </p>
          <p style="font-size: 12px; color: #666; margin-top: 15px;">
            لسلامتك، لا تشارك هذا الرمز مع أي شخص
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
  };    
  

  return mailOptions;
};

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
