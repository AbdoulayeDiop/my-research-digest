const crypto = require('crypto');
const Issue = require('../models/Issue');
const Reading = require('../models/Reading'); // Import Reading model
const User = require('../models/User'); // Import User model to find user by ID


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

      // Ensure the user exists (or create a placeholder if necessary for Reading model)
      // For public routes, userId will be the MongoDB _id, not auth0Id
      let user = await User.findById(userId);
      if (!user) {
        // This scenario indicates an issue with the userId provided in the signed URL
        // or a deleted user. Redirect to error or forbidden.
        console.warn(`markAsReadFromEmail: User ${userId} not found for issue ${issueId}.`);
        return res.redirect(`${appDomain}/status/error`);
      }
      
      // Add user to readBy array if not already present
      await Reading.findOneAndUpdate(
        { userId: user._id, issueId },
        { readAt: Date.now() },
        { upsert: true, new: true }
      );

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