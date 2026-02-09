const Issue = require('../models/Issue');
const Newsletter = require('../models/Newsletter');
const Paper = require('../models/Paper'); // Import Paper model
const User = require('../models/User');
const Reading = require('../models/Reading'); // Import Reading model


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

// Get all issues for a specific newsletter
exports.getIssuesForNewsletter = async (req, res) => {
  try {
    const { newsletterId } = req.params;
    const { limit, sort } = req.query;

    const query = { newsletterId };
    let mongooseQuery = Issue.find(query);

    if (sort) {
      mongooseQuery = mongooseQuery.sort(sort);
    } else {
      mongooseQuery = mongooseQuery.sort({ publicationDate: -1 });
    }

    if (limit) {
      mongooseQuery = mongooseQuery.limit(parseInt(limit));
    }

    const issues = await mongooseQuery;
    res.status(200).json(issues);
  } catch (error) {
    console.error("Error in getIssuesForNewsletter:", error);
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

    const issues = await Issue.find({ newsletterId: { $in: newsletterIds } }).sort({ publicationDate: -1 });

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
    const { id: issueId } = req.params;
    const { read } = req.body; // Expecting 'read' boolean
    const auth0Id = req.auth.payload.sub; // from JWT

    const user = await User.findOne({ auth0Id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    if (read) {
      // Mark as read: Create a Reading document
      await Reading.findOneAndUpdate(
        { userId: user._id, issueId },
        { readAt: Date.now() },
        { upsert: true, new: true }
      );
    } else {
      // Mark as unread: Remove the Reading document
      await Reading.findOneAndDelete({ userId: user._id, issueId });
    }

    // Optimization: Return only the essential update
    res.status(200).json({ _id: issueId, read });

  } catch (error) {
    console.error("Error in toggleReadStatus:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getIssuePaperCount = async (req, res) => {
  try {
    const { id: issueId } = req.params;
    const count = await Paper.countDocuments({ issueId });
    res.status(200).json({ _id: issueId, paperCount: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getIssueReadStatus = async (req, res) => {
  try {
    if (!req.auth || !req.auth.payload || !req.auth.payload.sub) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }
    const { id: issueId } = req.params;
    const auth0Id = req.auth.payload.sub;

    const user = await User.findOne({ auth0Id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const reading = await Reading.findOne({ userId: user._id, issueId });
    res.status(200).json({ _id: issueId, read: !!reading });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};