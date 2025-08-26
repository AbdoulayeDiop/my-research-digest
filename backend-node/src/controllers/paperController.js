const Paper = require('../models/Paper');

// Get all papers for a specific issue
exports.getPapersByIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const papers = await Paper.find({ issue: issueId });
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