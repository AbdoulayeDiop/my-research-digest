const Issue = require('../models/Issue');
const Newsletter = require('../models/Newsletter');
const Paper = require('../models/Paper'); // Import Paper model
const User = require('../models/User');

// Create a new issue for a newsletter
exports.createIssue = async (req, res) => {
  try {
    const { newsletterId, title, publicationDate, summary, introduction, conclusion, contentMarkdown, status } = req.body; // Get newsletterId from body

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
exports.getIssuesForNewsletter = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.auth || !req.auth.payload || !req.auth.payload.sub) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }
    const { newsletterId } = req.params;
    const auth0Id = req.auth.payload.sub;

    const user = await User.findOne({ auth0Id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify that the newsletter exists
    const newsletter = await Newsletter.findById(newsletterId);
    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }

    const issues = await Issue.aggregate([
      { $match: { newsletterId: newsletter._id } },
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
          read: { $in: [user._id, { $ifNull: ['$readBy', []] }] } // Check if user's ID is in readBy array
        },
      },
      {
        $project: {
          papersInfo: 0, // Exclude the full papersInfo array
          readBy: 0 // Exclude the readBy array from the final output
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

// Get all issues for the authenticated user
exports.getIssuesForAuthenticatedUser = async (req, res) => {
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

    const issues = await Issue.aggregate([
      { $match: { newsletterId: { $in: newsletterIds } } },
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
          read: { $in: [user._id, { $ifNull: ['$readBy', []] }] }
        },
      },
      {
        $project: {
          papersInfo: 0,
          readBy: 0
        },
      },
      { $sort: { publicationDate: -1 } },
    ]);

    res.status(200).json(issues);
  } catch (error) {
    console.error("Error in getIssuesForAuthenticatedUser:", error);
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

exports.toggleReadStatus = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.auth || !req.auth.payload || !req.auth.payload.sub) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }
    const { id } = req.params;
    const { read } = req.body; // Expecting 'read' boolean
    const auth0Id = req.auth.payload.sub; // from JWT

    const user = await User.findOne({ auth0Id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Add or remove the user's ID from the readBy array
    if (read) {
      // Add user to readBy array if not already present
      await Issue.updateOne({ _id: id }, { $addToSet: { readBy: user._id } });
    } else {
      // Remove user from readBy array
      await Issue.updateOne({ _id: id }, { $pull: { readBy: user._id } });
    }

    // Fetch the updated issue to return it
    const updatedIssue = await Issue.findById(id);
    res.status(200).json(updatedIssue);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};