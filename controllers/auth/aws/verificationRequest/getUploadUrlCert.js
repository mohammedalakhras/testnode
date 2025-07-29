const s3 = require("../../../../src/config/aws.js");

exports.getUploadUrlVeriRequest = async (req, res, next) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) {
      return res.status(400).json({ msg: "filename و contentType مطلوبين" });
    }
    const key = `verification/${Date.now()}_${filename}`;

    const url = await s3.getSignedUrlPromise("putObject", {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Expires: 300, // صلاحية 5 دقائق
      ContentType: contentType,
      ACL: "private",
    });

    res.json({ key, url });
  } catch (err) {
    next(err);
  }
};
