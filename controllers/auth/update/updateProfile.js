const bcrypt = require("bcryptjs");
const { UserModel, validateProfileUpdate } = require("../../../models/User.js");

const {
  sendVerificationEmail,
} = require("../../../src/lib/emailVerification.js");

const s3 = require("../../../src/config/aws.js");

exports.updateProfile = async (req, res) => {
  try {
    // 1. Validate input (only allowed fields)
    const { error, value } = validateProfileUpdate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, msg: error.details[0].message });
    }

    const emailUsedByAnotheruser = await UserModel.findOne({
      email: value.email,
    });

    if (emailUsedByAnotheruser) {
      return res.status(403).json({
        success: false,
        msg: "E-mail is Already Used by Another User",
      });
    }
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    // 2. Handle email change as a two‑step flow
    if (value.email && value.email !== user.email) {
      const code = Math.floor(10000 + Math.random() * 90000).toString();
      const expires = new Date();
      expires.setHours(expires.getHours() + 24);

      user.pendingEmail = value.email;
      user.pendingEmailVerificationCode = code;
      user.pendingEmailVerificationExpires = expires;
      await user.save();

      // send verification mail to the new address
      const mailOptions = {
        from: {
          name: "تطبيق BuyTx",
          address: process.env.GMAIL,
        },
        to: user.pendingEmail, // الإرسال إلى الإيميل الجديد
        priority: "high",

        subject: "تأكيد تغيير بريدك الإلكتروني - BuyTx",
        text: `مرحباً ${user.username || "عميلنا الكريم"},
      
      لقد طلبت تغيير بريدك الإلكتروني من:
      ${user.email}
      
      إلى:
      ${user.pendingEmail}
      
      للتأكيد، يرجى استخدام رمز التفعيل التالي:
      
      ${code}
      
      هذا الرمز صالح لمدة 24 ساعة.
      إذا لم تطلب تغيير بريدك، يرجى تجاهل هذه الرسالة.
      
      © ${new Date().getFullYear()} BuyTx. جميع الحقوق محفوظة.
      `,
        html: `<!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تأكيد تغيير البريد الإلكتروني</title>
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
            color: #ffffff;
            font-size: 18px;
            line-height: 1.4;
          }
          .content {
            padding: 30px;
            color: #333333;
            line-height: 1.6;
          }
          .content h1 {
            color: #1A472A;
            font-size: 22px;
            margin-bottom: 20px;
          }
          .content p {
            font-size: 16px;
            margin-bottom: 15px;
          }
          .email-info {
            background-color: #f0f0f0;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
            font-size: 14px;
            color: #555555;
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
        <table class="container" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td class="header">
              <strong>تغيير بريدك الإلكتروني على منصة BuyTx</strong>
            </td>
          </tr>
          <tr>
            <td class="content">
              <h1>مرحباً ${user.username || "عميلنا الكريم"}</h1>
              <p>لقد طلبت تغيير بريدك الإلكتروني من:</p>
              <div class="email-info">${user.email}</div>
              <p>إلى:</p>
              <div class="email-info">${user.pendingEmail}</div>
              <p>لإتمام عملية التغيير، يرجى إدخال رمز التفعيل التالي:</p>
              <div class="verification-box">
                <p>رمز التفعيل الخاص بك:</p>
                <div class="verification-code">${code}</div>
                <p>هذا الرمز صالح لمدة 24 ساعة.</p>
              </div>
              <p>إذا لم تطلب هذا التغيير، يمكنك تجاهل هذه الرسالة بأمان.</p>
            </td>
          </tr>
          <tr>
            <td class="footer">
              © ${new Date().getFullYear()} BuyTx. جميع الحقوق محفوظة.
            </td>
          </tr>
        </table>
      </body>
      </html>`,
      };

      await sendVerificationEmail(mailOptions);

      // remove email from the update payload so it isn’t applied yet
      delete value.email;
    }

    // 3. Handle password hashing
    if (value.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(value.password, salt);
      delete value.password;
    }

    if (value.fullName) {
      user.fullName = value.fullName;
    }

    // 6. Handle username (check uniqueness)
    if (value.username && value.username !== user.username) {
      const exists = await UserModel.findOne({
        username: value.username,
        _id: { $ne: user._id },
      });
      if (exists) {
        return res
          .status(409)
          .json({ success: false, msg: "Username already taken." });
      }
      user.username = value.username;
    }

    // 7. Handle phone
    if (value.phone) {
      user.phone = value.phone;
    }

    // 8. Handle phoneVisible
    if (typeof value.phoneVisible === "boolean") {
      user.phoneVisible = value.phoneVisible;
    }

    // 9. Change photo or cover :
    // ---- NEW: Handle photo / cover (S3 keys) ----
    // helper to delete old S3 object if present and update field
    async function handleKeyUpdate(fieldName, newKey) {
      const oldKey = user[fieldName];

      // if newKey is undefined => field not provided in request => do nothing
      if (typeof newKey === "undefined") return;

      // if client asked to clear the image (null or empty string)
      if (newKey === null || newKey === "") {
        if (oldKey) {
          try {
            await s3
              .deleteObject({ Bucket: process.env.AWS_S3_BUCKET, Key: oldKey })
              .promise();
          } catch (err) {
            console.warn(
              `Failed to delete old S3 object (${oldKey}):`,
              err.message || err
            );
            // لا نفشل التحديث بسبب مشكلة في الحذف
          }
        }
        user[fieldName] = null;
        return;
      }

      // new key provided (non-empty string)
      if (oldKey && oldKey !== newKey) {
        try {
          await s3
            .deleteObject({ Bucket: process.env.AWS_S3_BUCKET, Key: oldKey })
            .promise();
        } catch (err) {
          console.warn(
            `Failed to delete old S3 object (${oldKey}):`,
            err.message || err
          );
          // نستمر حتى لو فشل الحذف
        }
      }
      user[fieldName] = newKey;
    }

    await handleKeyUpdate("photo", value.photo);
    await handleKeyUpdate("cover", value.cover);

    // 10. Finally save any changes
    await user.save();

    res.json({
      success: true,
      msg: value.email
        ? "Profile updated; verification email sent to your new address."
        : "Profile updated successfully.",
      user: {
        fullName: user.fullName,
        username: user.username,
        email: user.email, // still the old one until verified
        pendingEmail: user.pendingEmail, // the new one, awaiting verification
        phone: user.phone,
        phoneVisible: user.phoneVisible,
        photo: user.photo,
        cover: user.cover,
      },
    });
  } catch (err) {
    return res.status(500).json({ msg: err });
  }
};
