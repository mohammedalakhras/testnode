/**
 * HELPER: Hide phone number from comments or replies.
 * Masks phone numbers by replacing digits after country code with stars
 * for users without permission to view them.
 *
 * Permissions to view full numbers granted if viewer is:
 *   1) The owner of the content (comment or reply)
 *   2) The owner of the product
 *   3) In case of replies: the owner of the parent comment
 *
 * @param {String} content - comment or reply content.
 * @param {String|null} viewerId - id of viewer (null if anonymous).
 * @param {String} productOwnerId - id of product owner.
 * @param {String} contentOwnerId - id of user who published this content.
 * @param {String|null} parentCommentOwnerId - id of parent comment owner (null for top-level comments).
 * @returns {String} - processed content with phone numbers hidden or intact.
 */
function hidePhoneIfNotAllowed(
  content,
  viewerId,
  productOwnerId,
  contentOwnerId,
  parentCommentOwnerId = null
) {
  // Regex to match phone numbers: prefix (optional + and 1-3 digits) then at least 4 digits
  const phoneRegex = /(\+?\d{1,3})(\d{4,})/g;

  // Helper to mask digits with stars
  const maskReplacer = (fullMatch, prefix, digits) => {
    const masked = "*".repeat(digits.length);
    return `${prefix}${masked}`;
  };

  // Determine permission: viewerId must match one of allowed roles
  const canView =
    viewerId &&
    (viewerId.toString() === contentOwnerId.toString() || // content owner
      viewerId.toString() === productOwnerId.toString() || // product owner
      (parentCommentOwnerId &&
        viewerId.toString() === parentCommentOwnerId.toString())); // parent comment owner for replies

  if (canView) {
    // Allowed: return original content
    return content;
  }

  // Not allowed or anonymous: mask all phone numbers

  return content.replace(phoneRegex, maskReplacer);
}

module.exports = hidePhoneIfNotAllowed;
