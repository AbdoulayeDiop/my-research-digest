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

// Get all issues for a specific newsletter with paper count
exports.getIssuesForNewsletter = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.auth || !req.auth.payload || !req.auth.payload.sub) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }
    const { newsletterId } = req.params;
    const { limit, sort } = req.query; // Added limit and sort back since Python backend uses them
    const auth0Id = req.auth.payload.sub;

    const pythonClientId = process.env.AUTH0_PYTHON_CLIENT_ID;
    const isPythonBackend = pythonClientId && auth0Id && (auth0Id === pythonClientId || auth0Id === `${pythonClientId}@clients`);

    let user = null;
    if (!isPythonBackend) {
      user = await User.findOne({ auth0Id });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    // Verify that the newsletter exists
    const newsletter = await Newsletter.findById(newsletterId);
    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }

    const pipeline = [
      { $match: { newsletterId: newsletter._id } },
      {
        $lookup: {
          from: 'papers',
          localField: '_id',
          foreignField: 'issueId',
          as: 'papersInfo',
        },
      },
      // Lookup into the new Readings collection to determine read status
      {
        $lookup: {
          from: 'readings',
          let: { issueId: '$_id', userId: user ? user._id : null }, // Use user._id if available
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$issueId', '$$issueId'] },
                    { $eq: ['$userId', '$$userId'] },
                  ],
                },
              },
            },
          ],
          as: 'userReadingStatus',
        },
      },
      {
        $addFields: {
          paperCount: { $size: '$papersInfo' },
          read: isPythonBackend ? false : { $gt: [{ $size: '$userReadingStatus' }, 0] }
        },
      },
      {
        $project: {
          papersInfo: 0,
          userReadingStatus: 0, // Exclude the lookup result
        },
      },
    ];

    // Add sort
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      pipeline.push({ $sort: { [sortField]: sortOrder } });
    } else {
      pipeline.push({ $sort: { publicationDate: -1 } });
    }

    // Add limit
    if (limit) {
      pipeline.push({ $limit: parseInt(limit) });
    }

    const issues = await Issue.aggregate(pipeline);

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
      // Lookup into the new Readings collection to determine read status
      {
        $lookup: {
          from: 'readings', // The name of the new readings collection
          let: { issueId: '$_id', userId: user._id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$issueId', '$$issueId'] },
                    { $eq: ['$userId', '$$userId'] },
                  ],
                },
              },
            },
          ],
          as: 'userReadingStatus',
        },
      },
      {
        $addFields: {
          paperCount: { $size: '$papersInfo' },
          read: { $gt: [{ $size: '$userReadingStatus' }, 0] }
        },
      },
      {
        $project: {
          papersInfo: 0,
          userReadingStatus: 0, // Exclude the lookup result
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

    // Fetch the updated issue with paperCount and read status
    const updatedIssueAggregation = await Issue.aggregate([
      { $match: { _id: issue._id } },
      {
        $lookup: {
          from: 'papers', // The name of the papers collection
          localField: '_id',
          foreignField: 'issueId',
          as: 'papersInfo',
        },
      },
      {
        $lookup: {
          from: 'readings', // The name of the new readings collection
          let: { issueId: '$_id', userId: user._id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$issueId', '$$issueId'] },
                    { $eq: ['$userId', '$$userId'] },
                  ],
                },
              },
            },
          ],
          as: 'userReadingStatus',
        },
      },
      {
        $addFields: {
          paperCount: { $size: '$papersInfo' },
          read: { $gt: [{ $size: '$userReadingStatus' }, 0] } // Check if userReadingStatus array has elements
        },
      },
      {
        $project: {
          papersInfo: 0, // Exclude the full papersInfo array
          userReadingStatus: 0, // Exclude the lookup result
        },
      },
    ]);

    if (updatedIssueAggregation.length > 0) {
      res.status(200).json(updatedIssueAggregation[0]);
    } else {
      res.status(404).json({ message: 'Issue not found after update' });
    }

  } catch (error) {
    console.error("Error in toggleReadStatus:", error);
    res.status(500).json({ message: error.message });
  }
};