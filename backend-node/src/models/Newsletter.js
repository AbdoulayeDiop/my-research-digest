const mongoose = require('mongoose');

const NewsletterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  topic: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  field: {
    type: String,
    trim: true,
  },
  lastSearch: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  rankingStrategy: {
    type: String,
    enum: ['author_based', 'embedding_based'],
    default: 'author_based'
  },
  frequency: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly'],
    default: 'weekly'
  },
  issueFormat: {
    type: String,
    enum: ['classic', 'state_of_the_art'],
    default: 'classic'
  },
  queries: {
    type: [String],
    default: []
  },
  inactivityWarningSentAt: {
    type: Date,
  },
  filters: {
    venues: {
      type: [String],
      default: []
    },
    publicationTypes: {
      type: [String],
      enum: [
        'Review',
        'JournalArticle',
        'CaseReport',
        'ClinicalTrial',
        'Conference',
        'Dataset',
        'Editorial',
        'LettersAndComments',
        'MetaAnalysis',
        'News',
        'Study',
        'Book',
        'BookSection'
      ],
      default: []
    },
    minCitationCount: {
      type: Number,
      default: 0
    },
    openAccessPdf: {
      type: Boolean,
      default: false
    }
  }
}, {timestamps: true});

module.exports = mongoose.model('Newsletter', NewsletterSchema);