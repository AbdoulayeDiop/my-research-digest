const Paper = require('../models/Paper');
const User = require('../models/User');
const Newsletter = require('../models/Newsletter');
const Issue = require('../models/Issue');

// Get all papers for the authenticated user
exports.getPapersForAuthenticatedUser = async (req, res) => {
  try {
    if (!req.auth || !req.auth.payload || !req.auth.payload.sub) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }
    const auth0Id = req.auth.payload.sub;

    const user = await User.findOne({ auth0Id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newsletters = await Newsletter.find({ userId: user._id });
    const newsletterIds = newsletters.map(nl => nl._id);

    const issues = await Issue.find({ newsletterId: { $in: newsletterIds } });
    const issueIds = issues.map(issue => issue._id);

    const papers = await Paper.find({ issueId: { $in: issueIds } }).sort({ publicationDate: -1 });

    res.status(200).json(papers);
  } catch (error) {
    console.error("Error in getPapersForAuthenticatedUser:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all papers for a specific issue
exports.getPapersByIssue = async (req, res) => {
  try {
    const { issueId } = req.query;
    const papers = await Paper.find({ issueId: issueId });
    res.status(200).json(papers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create multiple papers
exports.createPapers = async (req, res) => {
  try {
    const papersData = req.body; // expecting an array of paper objects, each with an issueId
    const createdPapers = await Paper.insertMany(papersData);
    res.status(201).json(createdPapers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch multiple papers by their IDs
exports.getPapersByIds = async (req, res) => {
  try {
    const { ids } = req.body; // expecting an array of paper IDs
    const papers = await Paper.find({ paperId: { $in: ids } });
    res.status(200).json(papers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPapersByIssueId = async (req, res) => {
  try {
    const { issueId } = req.params;
    const papers = await Paper.find({ issueId }).sort({ score: -1 }); // Sort by score descending
    res.status(200).json(papers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.countPapers = async (req, res) => {
  try {
    const count = await Paper.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.setFeedback = async (req, res) => {
  const { paperId } = req.params;
  const { feedback } = req.body;

  if (feedback && !['like', 'dislike', 'heart'].includes(feedback)) {
    return res.status(400).json({ message: 'Invalid feedback value.' });
  }

  try {
    const paper = await Paper.findById(paperId);
    if (!paper) {
      return res.status(404).json({ message: 'Paper not found.' });
    }

    paper.feedback = feedback;
    await paper.save();
    res.status(200).json(paper);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};