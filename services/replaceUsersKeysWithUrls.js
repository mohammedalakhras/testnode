const {getMediaUrls} =require('../controllers/auth/aws/users/getUserMediaURLs.js')
/**
 * S3 key or [S3 keys] => link | [links]
 * @param {string|string[]|null} keys
 * @param {boolean} download - هل نريد تحميل الملف attachment أو عرضه inline
 * @returns {Promise<string|string[]|null>}
 */
async function replaceUserKeysWithUrls(keys, download = false) {
  if (!keys) return null;

  if (Array.isArray(keys)) {
    if (!keys.length) return [];
    return await getMediaUrls(keys, download);
  }

  return await getMediaUrls([keys], download).then((urls) => urls[0]);
}

module.exports = { replaceUserKeysWithUrls };
