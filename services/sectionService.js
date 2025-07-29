const {
  getMediaUrls,
} = require("../controllers/auth/aws/users/getUserMediaURLs.js");

/**
 * يعيد content بعد استبدال التوكن برابط موقّع
 * @param {string} content
 * @param {Object} keysMap   - خريطة token→s3key
 */
async function resolveContentUrls(content, keysMap) {
  const tokens = Object.keys(keysMap);
  if (!tokens.length) return content;

  const s3Keys = tokens.map((t) => keysMap[t]);
  console.log(s3Keys);

  const urls = await getMediaUrls(s3Keys);
  console.log(urls);

  // استبدال في المحتوى
  let resolved = content;
  tokens.forEach((token, idx) => {
    // token قد يكون مع أو بدون @
    const t = token.startsWith("@") ? token : `@${token}`;
    const re = new RegExp(t.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "g");
    resolved = resolved.replace(re, urls[idx]);
  });

  return resolved;
}

module.exports = { resolveContentUrls };
