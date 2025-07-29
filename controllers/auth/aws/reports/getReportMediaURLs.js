const s3 = require("../../../../src/config/aws.js");

async function getReportsMediaUrls(keys, download = false) {
  if (keys.length == 0) return [];

  if (Array.isArray(keys)) {
    const promises = keys.map((key) => {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `${key}`,
        Expires: 300,
        ResponseContentDisposition: download ? "attachment" : "inline",
      };
      return s3.getSignedUrlPromise("getObject", params);
    });

    const urls = await Promise.all(promises);

    return urls;
  }

  // إذا مفتاح واحد
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${keys}`,
    Expires: 300,
    ResponseContentDisposition: download ? "attachment" : "inline",
  };
  const url = await s3.getSignedUrlPromise("getObject", params);
  return url;
}

exports.getReportsMediaUrls = getReportsMediaUrls;
