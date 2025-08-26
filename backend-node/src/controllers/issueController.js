const Issue = require('../models/Issue');
const Newsletter = require('../models/Newsletter');
const Paper = require('../models/Paper'); // Import Paper model

// Create a new issue for a newsletter
exports.createIssue = async (req, res) => {
  try {
    const { newsletterId } = req.params; // Get newsletterId from URL params
    const { title, publicationDate, summary, introduction, conclusion, contentMarkdown, status } = req.body; // Removed 'papers' from destructuring

    // Verify that the newsletter exists
    const newsletter = await Newsletter.findById(newsletterId);
    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }

    const newIssue = new Issue({
      newsletterId,
      title,
      publicationDate,
      summary,
      introduction,
      conclusion,
      contentMarkdown,
      status,
    });
    await newIssue.save();
    res.status(201).json(newIssue);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all issues for a specific newsletter with paper count
exports.getIssuesByNewsletter = async (req, res) => {
  try {
    const { newsletterId } = req.params;

    // Verify that the newsletter exists
    const newsletter = await Newsletter.findById(newsletterId);
    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }

    const issues = await Issue.aggregate([
      { $match: { newsletterId: newsletter._id } },
      { $addFields: { issueObjectId: "$_id" } }, // Convert _id to string for logging if needed
      { $addFields: { newsletterObjectId: "$newsletterId" } }, // Convert newsletterId to string for logging if needed
      { $addFields: { issueIdString: { $toString: "$_id" } } }, // Convert _id to string for lookup if needed
      { $addFields: { newsletterIdString: { $toString: "$newsletterId" } } }, // Convert newsletterId to string for lookup if needed
      {
        $lookup: {
          from: 'papers', // The name of the papers collection
          localField: '_id',
          foreignField: 'issueId',
          as: 'papersInfo',
        },
      },
      {
        $addFields: {
          paperCount: { $size: '$papersInfo' },
        },
      },
      {
        $project: {
          papersInfo: 0, // Exclude the full papersInfo array if not needed
        },
      },
      { $sort: { publicationDate: -1 } },
    ]);

    res.status(200).json(issues);
  } catch (error) {
    console.error("Error in getIssuesByNewsletter:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get a single issue by ID
exports.getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.status(200).json(issue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an issue
exports.updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, publicationDate, summary, introduction, conclusion, contentMarkdown, status } = req.body; // Removed 'papers' from destructuring

    const updatedIssue = await Issue.findByIdAndUpdate(
      id,
      { title, publicationDate, summary, introduction, conclusion, contentMarkdown, status },
      { new: true, runValidators: true }
    );

    if (!updatedIssue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.status(200).json(updatedIssue);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an issue
exports.deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    await Issue.findByIdAndDelete(id);
    res.status(200).json({ message: 'Issue deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.countIssues = async (req, res) => {
  try {
    const count = await Issue.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};