const mongoose = require('mongoose');

const ReadingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  issueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true,
  },
  readAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure that a user can only mark an issue as read once
ReadingSchema.index({ userId: 1, issueId: 1 }, { unique: true });

module.exports = mongoose.model('Reading', ReadingSchema);
