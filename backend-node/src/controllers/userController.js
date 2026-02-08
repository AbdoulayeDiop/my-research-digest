const User = require('../models/User');
const Newsletter = require('../models/Newsletter');
const Issue = require('../models/Issue');
const Paper = require('../models/Paper');
const Reading = require('../models/Reading'); // Import Reading model
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

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.syncUser = async (req, res) => {
  try {
    const { auth0Id, email, name } = req.body;
    let user = await User.findOne({ auth0Id });
    let isNewUser = false;

    if (!user) {
      // User does not exist, create a new one
      user = new User({ auth0Id, email, name, lastLoginAt: Date.now() });
      await user.save();
      isNewUser = true;
    } else {
      // User exists, update their information and last login time
      user.email = email;
      user.name = name;
      user.lastLoginAt = Date.now(); // Update last login time
      await user.save();
    }

    if (isNewUser) {
      // Send welcome email
      const mailOptions = {
        from: `"My Research Digest" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Welcome to My Research Digest!',
        html: `
          <p>Dear ${name},</p>
          <p>Welcome to My Research Digest! We're excited to have you on board.</p>
          <p>You can now create personalized AI-powered newsletters that automatically discover, analyze, and synthesize the top 5 research papers from your field of interest every week.</p>
          <p>Get started by creating your first newsletter:</p>
          <p><a href="https://my-research-digest.com">Go to My Research Digest</a></p>
          <p>Best regards,</p>
          <p>The My Research Digest Team</p>
        `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending welcome email:', error);
        } else {
          console.log('Welcome email sent:', info.response);
        }
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId; // This will be the MongoDB _id of the user

    // 1. Find all newsletters created by this user
    const newsletters = await Newsletter.find({ userId });
    const newsletterIds = newsletters.map(nl => nl._id);

    // 2. Find all issues associated with these newsletters
    const issues = await Issue.find({ newsletterId: { $in: newsletterIds } });
    const issueIds = issues.map(issue => issue._id);

    // 3. Delete all papers associated with these issues
    if (issueIds.length > 0) {
      await Paper.deleteMany({ issueId: { $in: issueIds } });
    }

    // 4. Delete all issues associated with these newsletters
    if (newsletterIds.length > 0) {
      await Issue.deleteMany({ newsletterId: { $in: newsletterIds } });
    }

    // 5. Delete all newsletters created by this user
    await Newsletter.deleteMany({ userId });

    // 6. Delete all readings associated with this user
    await Reading.deleteMany({ userId });

    // 7. Delete the user document itself
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.countUsers = async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsersWithNewsletterCount = async (req, res) => {
  try {
    const usersWithNewsletterCount = await User.aggregate([
      {
        $lookup: {
          from: 'newsletters', // The collection name for newsletters
          localField: '_id',
          foreignField: 'userId',
          as: 'newsletters',
        },
      },
      {
        $addFields: {
          newsletterCount: { $size: '$newsletters' },
        },
      },
      {
        $project: {
          newsletters: 0, // Exclude the newsletters array if not needed, keep count
        },
      },
    ]);
    res.status(200).json(usersWithNewsletterCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getActiveUsers = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsers = await User.find({
      lastLoginAt: { $gte: sevenDaysAgo }
    }).countDocuments();

    res.status(200).json({ activeUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};