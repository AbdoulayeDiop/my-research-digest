const crypto = require('crypto');
const Issue = require('../models/Issue');

exports.markAsReadFromEmail = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { userId, signature } = req.query;
    const secret = process.env.URL_SIGNATURE_SECRET;

    if (!userId || !signature || !secret) {
      return res.status(400).send('<html><body><h1>Bad Request</h1><p>Missing required parameters.</p></body></html>');
    }

    // Verify signature
    const dataToSign = `${issueId}${userId}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');

    // Use a constant-time comparison to prevent timing attacks
    if (signature.length === expectedSignature.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      // Signature is valid, update the issue
      // Using findById and save could be slightly slower but ensures the issue exists
      const issue = await Issue.findById(issueId);
      if (!issue) {
        return res.status(404).send('<html><body><h1>Issue not found</h1></body></html>');
      }
      
      // Add user to readBy array if not already present
      if (!issue.readBy.includes(userId)) {
        issue.readBy.push(userId);
        await issue.save();
      }

      // Redirect to the issue page
      const issueUrl = `${process.env.APP_DOMAIN}/issues/${issueId}`;
      return res.redirect(302, issueUrl);

    } else {
      // Signature is invalid
      return res.status(403).send('<html><body><h1>Forbidden</h1><p>Invalid signature.</p></body></html>');
    }

  } catch (error) {
    console.error('Error marking issue as read from email:', error);
    res.status(500).send('<html><body><h1>Error</h1><p>An unexpected error occurred.</p></body></html>');
  }
};