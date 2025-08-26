const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
  newsletterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Newsletter',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  publicationDate: {
    type: Date,
    default: Date.now,
  },
  summary: {
    type: String,
  },
  introduction: {
    type: String,
  },
  conclusion: {
    type: String,
  },
  contentMarkdown: {
    type: String,
  },
  
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'draft',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Issue', IssueSchema);