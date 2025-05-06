// src/controllers/fileController.js
const s3 = require("../../../../src/config/aws.js");

exports.chatMediaDownloader = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { download } = req.query;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: "chats/"+key,
      Expires: 300, // صلاحية 5 دقائق
      ResponseContentDisposition: download ? 'attachment' : 'inline'
    };

    const url = await s3.getSignedUrlPromise("getObject", params);
    
    res.json({ url });
  } catch (err) {
    console.error('Error generating download URL:', err);
    next(err);
  }
};