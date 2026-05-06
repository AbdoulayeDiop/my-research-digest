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
  issueFormat: {
    type: String,
    enum: ['classic', 'state_of_the_art'],
    default: 'classic',
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'draft',
  },
  rating: {
    type: String,
    enum: ['useful', 'not_useful', null],
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {timestamps: true});

module.exports = mongoose.model('Issue', IssueSchema);