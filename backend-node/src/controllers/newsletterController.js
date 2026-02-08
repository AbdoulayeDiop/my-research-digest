const Newsletter = require('../models/Newsletter');
const User = require('../models/User');
const Issue = require('../models/Issue'); // Import Issue model
const Paper = require('../models/Paper'); // Import Paper model
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  tls: {
    rejectUnauthorized: false
  },
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Create a new newsletter
exports.createNewsletter = async (req, res) => {
  try {
    if (!req.auth || !req.auth.payload || !req.auth.payload.sub) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }
    const auth0Id = req.auth.payload.sub;

    const { topic, description, field } = req.body;
    
    // Fetch user details from Auth0 or create if not exists
    const user = await User.findOneAndUpdate(
      { auth0Id },
      { $set: { email: req.auth.payload.email, name: req.auth.payload.name } }, // Assuming email/name are in JWT
      { new: true, upsert: true }
    );
    const newNewsletter = new Newsletter({ userId: user._id, topic, description, field });
    await newNewsletter.save();

    // Send confirmation email
    const mailOptions = {
      from: `"My Research Digest" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Confirmation: Your Newsletter on ${topic} Has Been Created!`,
      html: `
        <p>Dear ${user.name},</p>
        <p>Thank you for creating a new newsletter on the topic of <strong>${topic}</strong>!</p>
        <p>Your first AI-powered research digest for this topic will be generated and sent to your inbox within the next 24 hours.</p>
        <p>You can view and manage your newsletters here:</p>
        <p><a href="https://my-research-digest.com">Go to My Research Digest Dashboard</a></p>
        <p>Best regards,</p>
        <p>The My Research Digest Team</p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending newsletter confirmation email:', error);
      } else {
        console.log('Newsletter confirmation email sent:', info.response);
      }
    });

    res.status(201).json(newNewsletter);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all newsletters for the authenticated user
exports.getAuthenticatedUserNewsletters = async (req, res) => {
  try {
    if (!req.auth || !req.auth.payload || !req.auth.payload.sub) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }
    const auth0Id = req.auth.payload.sub;
    const user = await User.findOne({ auth0Id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newsletters = await Newsletter.aggregate([
      { $match: { userId: user._id } },
      {
        $lookup: {
          from: 'issues', // The name of the issues collection
          localField: '_id',
          foreignField: 'newsletterId',
          as: 'issuesInfo',
        },
      },
      {
        $addFields: {
          totalIssues: { $size: '$issuesInfo' },
          lastIssueDate: { $max: '$issuesInfo.createdAt' },
        },
      },
      {
        $project: {
          _id: 1,
          topic: 1,
          description: 1,
          field: 1,
          lastSearch: 1,
          createdAt: 1,
          totalIssues: 1,
          lastIssueDate: 1,
        },
      },
    ]);

    res.json(newsletters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all newsletters (admin only or backend)
exports.getAllNewsletters = async (req, res) => {
  try {
    const newsletters = await Newsletter.find();
    res.json(newsletters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single newsletter by ID
exports.getNewsletterById = async (req, res) => {
  try {
    const newsletter = await Newsletter.findById(req.params.id);
    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }
    res.json(newsletter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a newsletter
exports.updateNewsletter = async (req, res) => {
  try {
    const { topic, description, field, lastSearch } = req.body;
    const updatedNewsletter = await Newsletter.findByIdAndUpdate(
      req.params.id,
      { topic, description, field, lastSearch },
      { new: true } // Return the updated document
    );
    if (!updatedNewsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }
    res.json(updatedNewsletter);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a newsletter
exports.deleteNewsletter = async (req, res) => {
  try {
    const newsletterId = req.params.id;

    // 1. Find the newsletter to get its ID
    const newsletterToDelete = await Newsletter.findById(newsletterId);
    if (!newsletterToDelete) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }

    // 2. Find all issues associated with this newsletter
    const issues = await Issue.find({ newsletterId: newsletterToDelete._id });
    const issueIds = issues.map(issue => issue._id);

    // 3. Delete all papers associated with these issues
    if (issueIds.length > 0) {
      await Paper.deleteMany({ issueId: { $in: issueIds } });
    }

    // 4. Delete all issues associated with this newsletter
    await Issue.deleteMany({ newsletterId: newsletterToDelete._id });

    // 5. Delete the newsletter document itself
    const deletedNewsletter = await Newsletter.findByIdAndDelete(newsletterId);

    res.json({ message: 'Newsletter and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.countNewsletters = async (req, res) => {
  try {
    const count = await Newsletter.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};