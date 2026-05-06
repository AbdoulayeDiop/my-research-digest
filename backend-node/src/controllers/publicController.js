const crypto = require('crypto');
const Issue = require('../models/Issue');
const Reading = require('../models/Reading');
const User = require('../models/User');
const Newsletter = require('../models/Newsletter');


exports.submitFeedbackFromEmail = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { userId, rating, signature } = req.query;
    const secret = process.env.URL_SIGNATURE_SECRET;
    const appDomain = process.env.APP_DOMAIN || 'http://localhost';

    if (!userId || !rating || !signature || !secret) {
      return res.redirect(`${appDomain}/status/error`);
    }

    if (!['useful', 'not_useful'].includes(rating)) {
      return res.redirect(`${appDomain}/status/error`);
    }

    const dataToSign = `${issueId}${userId}${rating}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');

    if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return res.redirect(`${appDomain}/status/forbidden`);
    }

    const issue = await Issue.findById(issueId);
    if (!issue) return res.redirect(`${appDomain}/status/error`);

    const user = await User.findById(userId);
    if (!user) return res.redirect(`${appDomain}/status/error`);

    await Issue.findByIdAndUpdate(issueId, { rating });
    return res.redirect(`${appDomain}/status/feedback-success`);

  } catch (error) {
    console.error('Error submitting feedback from email:', error);
    const appDomain = process.env.APP_DOMAIN || 'http://localhost';
    res.redirect(`${appDomain}/status/error`);
  }
};

exports.reactivateNewsletterFromEmail = async (req, res) => {
  try {
    const { newsletterId } = req.params;
    const { userId, signature } = req.query;
    const secret = process.env.URL_SIGNATURE_SECRET;
    const appDomain = process.env.APP_DOMAIN || 'http://localhost';

    if (!userId || !signature || !secret) {
      return res.redirect(`${appDomain}/status/error`);
    }

    const dataToSign = `${newsletterId}${userId}reactivate`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');

    if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return res.redirect(`${appDomain}/status/forbidden`);
    }

    const newsletter = await Newsletter.findById(newsletterId);
    if (!newsletter) return res.redirect(`${appDomain}/status/error`);

    const user = await User.findById(userId);
    if (!user) return res.redirect(`${appDomain}/status/error`);

    await Newsletter.findByIdAndUpdate(newsletterId, { status: 'active', inactivityWarningSentAt: null, reactivatedAt: new Date() });
    return res.redirect(`${appDomain}/status/reactivated`);

  } catch (error) {
    console.error('Error reactivating newsletter from email:', error);
    const appDomain = process.env.APP_DOMAIN || 'http://localhost';
    res.redirect(`${appDomain}/status/error`);
  }
};

exports.markAsReadFromEmail = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { userId, signature } = req.query;
    const secret = process.env.URL_SIGNATURE_SECRET;
    const appDomain = process.env.APP_DOMAIN || 'http://localhost';

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
      return res.redirect(`${appDomain}/status/marked-as-read`);

    } else {
      // Signature is invalid
      return res.redirect(`${appDomain}/status/forbidden`);
    }

  } catch (error) {
    console.error('Error marking issue as read from email:', error);
    const appDomain = process.env.APP_DOMAIN || 'http://localhost';
    res.redirect(`${appDomain}/status/error`);
  }
};