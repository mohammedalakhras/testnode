const { UserModel } = require("../../../models/User.js");
const {
  sendVerificationEmail,
} = require("../../../src/lib/emailVerification.js");

exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        msg: "email Fields is Required",
      });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ msg: "User with this email not found." });
    }
    const resetCode = Math.floor(10000 + Math.random() * 90000).toString();

    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    user.passwordResetCode = resetCode;
    user.passwordResetExpires = resetExpires;
    await user.save();

    const mailOptions = {
      from: {
        name: "تطبيق BuyTx",
        address: process.env.GMAIL,
      },
      to: user.email,
      priority: "high",

      subject: "إعادة تعيين كلمة المرور – منصة BuyTx",
      text: `مرحباً ${user.username || "عميلنا الكريم"},
      
      لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك على منصة BuyTx. من فضلك استخدم رمز إعادة التعيين التالي:
      
      ${resetCode}
      
      هذا الرمز صالح لمدة ساعة واحدة. إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة.
      
      © ${new Date().getFullYear()}  BuyTx. جميع الحقوق محفوظة.
      `,
      html: `<!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إعادة تعيين كلمة المرور</title>
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
          .header p {
            color: #ffffff;
            font-size: 24px;
            margin: 0;
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
            color: #E74C3C;
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
              <p>BuyTx</p>
            </td>
          </tr>
          <tr>
            <td class="content" align="right">
              <h1>مرحباً ${user.username || "عميلنا الكريم"}</h1>
              <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك على منصة <strong>BuyTx</strong>. استخدم رمز إعادة التعيين أدناه:</p>
              <div class="verification-box">
                <p>رمز إعادة التعيين:</p>
                <div class="verification-code">${resetCode}</div>
                <p>هذا الرمز صالح لمدة ساعة واحدة</p>
              </div>
              <p>إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان.</p>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p>© ${new Date().getFullYear()}  BuyTx. جميع الحقوق محفوظة.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>`,
    };

    await sendVerificationEmail(mailOptions);

    return res
      .status(200)
      .json({ msg: "Password reset code sent to your email." });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Server error while processing forget password.",
      error: error,
    });
  }
};
