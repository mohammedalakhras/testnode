// // src/controllers/chatController.js
// const s3 = require("../../../../src/config/aws.js");

// exports.getProductMediaUrls = async (req, res, next) => {
//   try {
//     const { key } = req.params;
//     const { download } = req.query;

//     this.getMediaUrlsUrls(key,download);
    
//     res.json({ url });
//   } catch (err) {
//     console.error("Error generating download URL:", err);
//     next(err);
//   }
// };

// exports.getMediaUrls = async function getUrls(key, download) {
//   const params = {
//     Bucket: process.env.AWS_S3_BUCKET,
//     Key: "products/" + key,
//     Expires: 300, // صلاحية 5 دقائق
//     //  ResponseContentDisposition: download ? 'attachment' : 'inline'
//   };

//   const url = await s3.getSignedUrlPromise("getObject", params);

//   return url;
// };


// src/controllers/chatController.js
const s3 = require("../../../../src/config/aws.js");

// الكنترولر يستقبل مفاتيح مفردة أو مصفوفة مفاتيح
exports.getProductMediaUrls = async (req, res, next) => {
  try {
    // نقرأ المفاتيح من query param أو من body
    let keysParam = req.query.keys || req.body.keys;
    // نحوّل القيمة إلى مصفوفة (إذا كانت string مفصولة بفواصل)
    let keys = Array.isArray(keysParam)
      ? keysParam
      : typeof keysParam === 'string'
      ? keysParam.split(',').map(k => k.trim()).filter(Boolean)
      : [];

    if (!keys.length) {
      return res.status(400).json({ error: 'يرجى تمرير مفتاح واحد أو أكثر عبر keys.' });
    }

    const download = req.query.download === 'true';

    // ندعو الدالة التي تقبل مصفوفة أو مفتاح واحد
    const urls = await getMediaUrls(keys, download);

    res.json({ urls });
  } catch (err) {
    console.error("Error generating download URLs:", err);
    next(err);
  }
};

/**
 * دالة تعيد رابط موقع موقّع (signed) لتحميل أو عرض ملف من S3
 * @param {string|string[]} keys  - مفتاح واحد أو مصفوفة مفاتيح
 * @param {boolean} download      - إذا true ستكون Content-Disposition attachment
 * @returns {Promise<string|string[]>}  - رابط واحد أو مصفوفة روابط
 */
async function getMediaUrls(keys, download=false) {

  if(keys.length==0)
    return []
  // إذا keys مصفوفة
  if (Array.isArray(keys)) {
    // نبني وعود لكل مفتاح
    const promises = keys.map(key => {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `products/${key}`,
        Expires: 300,
        ResponseContentDisposition: download ? 'attachment' : 'inline'
       

      };
      return s3.getSignedUrlPromise('getObject', params);
    });
    // ننتظر جميع الروابط
    const urls = await Promise.all(promises);

    return urls;
  }

  // إذا مفتاح واحد
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `products/${keys}`,
    Expires: 300,
    ResponseContentDisposition: download ? 'attachment' : 'inline'
  };
  const url = await s3.getSignedUrlPromise('getObject', params);
  return url;
}

// إذا أردت التصدير (import) الدالة في ملفات أخرى
exports.getMediaUrls = getMediaUrls;
