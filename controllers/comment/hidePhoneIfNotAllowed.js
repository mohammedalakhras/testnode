function hidePhoneIfNotAllowed(
  content,
  viewerId,
  productOwnerId,
  contentOwnerId,
  parentCommentOwnerId = null
) {
  // Regex to match phone numbers with optional +prefix and at least 4 trailing digits
  const phoneRegex = /(?:(\+?\d{1,3})[\s-]?)(\d{4,})/g;

  // Helper to mask trailing digits with stars
  const maskReplacer = (_, prefix, digits) => {
    const masked = "*".repeat(digits.length);
    return `${prefix}${masked}`;
  };

  // Determine permission
  const canView =
    viewerId &&
    (viewerId === contentOwnerId || // owner of this content
      viewerId === productOwnerId || // product owner
      (parentCommentOwnerId && viewerId === parentCommentOwnerId)); // original comment owner

  if (canView) {
    return content;
  }

  // Mask all phone numbers in content
  return content.replace(phoneRegex, maskReplacer);
}

module.exports = hidePhoneIfNotAllowed;
