const mongoose = require('mongoose');

const SavedPaperSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  paperId: {
    type: String, // Semantic Scholar ID
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
  venueName: {
    type: String,
  },
  synthesis: {
    type: String,
  },
  usefulness: {
    type: String,
  },
  savedAt: {
    type: Date,
    default: Date.now,
  },
}, {timestamps: true});

// Ensure a user can only save a specific paper once
SavedPaperSchema.index({ userId: 1, paperId: 1 }, { unique: true });

module.exports = mongoose.model('SavedPaper', SavedPaperSchema);
