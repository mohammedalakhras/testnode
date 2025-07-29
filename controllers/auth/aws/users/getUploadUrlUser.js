const s3 = require("../../../../src/config/aws.js");

exports.getUploadUrlUser = async (req, res, next) => {
  try {
    if (req.body.filename && req.body.contentType) {
      const { filename, contentType } = req.body;
      const key = `users/${Date.now()}_${filename}`;
      const url = await s3.getSignedUrlPromise("putObject", {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Expires: 300, // صلاحية 5 دقائق
        ContentType: contentType,
        ACL: "private",
      });

      res.json({ key, url });
    } else {
      res.json({ msg: "{ filename, contentType }  fields are required" });
    }
  } catch (err) {
    next(err);
  }
};
