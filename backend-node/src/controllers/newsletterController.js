const Newsletter = require('../models/Newsletter');
const User = require('../models/User');
const Issue = require('../models/Issue'); // Import Issue model
const Paper = require('../models/Paper'); // Import Paper model
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

// Create a new newsletter
exports.createNewsletter = async (req, res) => {
  try {
    if (!req.auth || !req.auth.payload || !req.auth.payload.sub) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }
    const auth0Id = req.auth.payload.sub;

    const { topic, description } = req.body;
    
    // Fetch user details from Auth0 or create if not exists
    const user = await User.findOneAndUpdate(
      { auth0Id },
      { $set: { email: req.auth.payload.email, name: req.auth.payload.name } }, // Assuming email/name are in JWT
      { new: true, upsert: true }
    );

    const newNewsletter = new Newsletter({ 
      userId: user._id, 
      topic,
      description: description || "",
      status: 'active'
    });
    await newNewsletter.save();

    // Send confirmation email
    const mailOptions = {
      from: `"My Research Digest" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Confirmation: Your Newsletter on ${topic} is Active!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your newsletter on "${topic}" is now active!</h2>
          <p>Dear ${user.name},</p>
          <p>Thank you for creating a new newsletter on <strong>${topic}</strong>.</p>
          <p>The AI is already scheduled to scan for the latest research and send your first digest within the next 24 hours.</p>
          
          <p>While everything is ready to go, you can always fine-tune your settings (like search queries and filters) to make the results even more tailored to your needs:</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_DOMAIN}/newsletters/${newNewsletter._id}/settings" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Manage Newsletter Settings
            </a>
          </p>

          <p>Best regards,<br>The My Research Digest Team</p>
        </div>
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
          status: 1,
          rankingStrategy: 1,
          lastSearch: 1,
          filters: 1,
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
    const newsletters = await Newsletter.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $lookup: {
          from: 'issues',
          localField: '_id',
          foreignField: 'newsletterId',
          as: 'issues',
        },
      },
      {
        $addFields: {
          creatorName: { $arrayElemAt: ['$userDetails.name', 0] },
          issueCount: { $size: '$issues' },
          lastIssueDate: { $max: '$issues.createdAt' },
        },
      },
      {
        $project: {
          userDetails: 0,
          issues: 0,
        },
      },
    ]);
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
    const { description, status, rankingStrategy, queries, lastSearch, filters, inactivityWarningSentAt } = req.body;
    const updatedNewsletter = await Newsletter.findByIdAndUpdate(
      req.params.id,
      { description, status, rankingStrategy, queries, lastSearch, filters, inactivityWarningSentAt },
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

// Generate search queries for a newsletter (Deprecated: Use Python backend)
exports.generateQueries = async (req, res) => {
  res.status(410).json({ message: 'This endpoint is deprecated. Please use the Python backend to generate queries.' });
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

    // 5. Delete all readings associated with the issues of this newsletter
    await Reading.deleteMany({ issueId: { $in: issueIds } });

    // 6. Delete the newsletter document itself
    const deletedNewsletter = await Newsletter.findByIdAndDelete(newsletterId);

    res.json({ message: 'Newsletter and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOverdueNewsletters = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newsletters = await Newsletter.aggregate([
      {
        $match: {
          status: 'active',
          $and: [
            { lastSearch: { $exists: true } },
            { lastSearch: { $lt: sevenDaysAgo } },
          ],
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $addFields: {
          creatorName: { $arrayElemAt: ['$userDetails.name', 0] },
        },
      },
      {
        $project: {
          _id: 1,
          topic: 1,
          lastSearch: 1,
          creatorName: 1,
        },
      },
    ]);
    res.json(newsletters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetNewsletterLastSearch = async (req, res) => {
  try {
    const newsletter = await Newsletter.findByIdAndUpdate(
      req.params.id,
      { $unset: { lastSearch: '' } },
      { new: true }
    );
    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }
    res.json({ message: 'Newsletter queued for next worker run' });
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

const FIELDS = "title,authors,abstract,url,publicationVenue,publicationDate,citationCount,referenceCount,isOpenAccess,openAccessPdf,authors.authorId,authors.name,authors.affiliations,authors.paperCount,authors.citationCount,authors.hIndex,externalIds";
const axios = require('axios');

// Test search with current newsletter settings
exports.testSearch = async (req, res) => {
  try {
    const { id } = req.params;
    const newsletter = await Newsletter.findById(id);
    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }

    const { queries, filters } = newsletter;
    
    // Use stored queries
    let searchQueries = queries || [];
    if (searchQueries.length === 0) {
      return res.status(400).json({ message: 'No search queries found. Please generate or add queries first.' });
    }

    const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
    const headers = apiKey ? { "x-api-key": apiKey } : {};

    const allResults = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().split('T')[0];

    // Perform search for each query (limit to 5 per query for testing)
    for (const query of searchQueries) {
      const params = {
        query,
        publicationDateOrYear: `${startDate}:`,
        limit: 5,
        fields: FIELDS
      };

      if (filters) {
        if (filters.venues && filters.venues.length > 0) {
          params.venue = filters.venues.join(",");
        }
        if (filters.publicationTypes && filters.publicationTypes.length > 0) {
          params.publicationTypes = filters.publicationTypes.join(",");
        }
        if (filters.minCitationCount) {
          params.minCitationCount = filters.minCitationCount.toString();
        }
        if (filters.openAccessPdf) {
          params.openAccessPdf = "";
        }
      }

      try {
        const response = await axios.get("https://api.semanticscholar.org/graph/v1/paper/search", {
          params,
          headers
        });
        
        if (response.status === 200 && response.data.data) {
          allResults.push(...response.data.data);
        }
      } catch (err) {
        console.error(`Search error for query "${query}":`, err.message);
      }
    }

    // De-duplicate by paperId
    const seen = new Set();
    const uniqueResults = allResults.filter(paper => {
      const duplicate = seen.has(paper.paperId);
      seen.add(paper.paperId);
      return !duplicate;
    });

    res.json({ 
      count: uniqueResults.length,
      papers: uniqueResults 
    });
  } catch (error) {
    console.error('Error in testSearch:', error);
    res.status(500).json({ message: 'Failed to perform test search.' });
  }
};