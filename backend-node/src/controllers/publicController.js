const crypto = require('crypto');
const Issue = require('../models/Issue');

exports.markAsReadFromEmail = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { userId, signature } = req.query;
    const secret = process.env.URL_SIGNATURE_SECRET;
    const appDomain = process.env.APP_DOMAIN || process.env.FRONTEND_URL || 'http://localhost';

    if (!userId || !signature || !secret) {
      return res.redirect(`${appDomain}/status/error`);
    }

    // Verify signature
    const dataToSign = `${issueId}${userId}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');

    // Use a constant-time comparison to prevent timing attacks
    if (signature.length === expectedSignature.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      // Signature is valid, update the issue
      const issue = await Issue.findById(issueId);
      if (!issue) {
        return res.redirect(`${appDomain}/status/error`);
      }
      
      // Add user to readBy array if not already present
      if (!issue.readBy.includes(userId)) {
        issue.readBy.push(userId);
        await issue.save();
      }

      // Redirect to the success page
      return res.redirect(`${appDomain}/status/success`);

    } else {
      // Signature is invalid
      return res.redirect(`${appDomain}/status/forbidden`);
    }

  } catch (error) {
    console.error('Error marking issue as read from email:', error);
    const appDomain = process.env.APP_DOMAIN || process.env.FRONTEND_URL || 'http://localhost';
    res.redirect(`${appDomain}/status/error`);
  }
};