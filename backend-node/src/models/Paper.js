const mongoose = require('mongoose');

const PaperSchema = new mongoose.Schema({
  paperId: {
    type: String,
    required: true,
  },
  issueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  authors: {
    type: [String],
    default: [],
  },
  publicationDate: {
    type: Date,
  },
  abstract: {
    type: String,
  },
  url: {
    type: String,
  },
  synthesis: {
    type: String,
  },
  usefulness: {
    type: String,
  },
  score: {
    type: Number,
  },
  venueName: {
    type: String,
  },
  feedback: {
    type: String,
    enum: ['like', 'dislike', 'heart', null],
    default: null,
  },
});

module.exports = mongoose.model('Paper', PaperSchema, 'papers');