const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const comparisonResultSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  documents: {
    original: {
      title: String,
      length: Number,
      type: String,
      lastModified: Date,
      id: String
    },
    modified: {
      title: String,
      length: Number,
      type: String,
      lastModified: Date,
      id: String
    }
  },
  comparison: {
    characterDiff: {
      type: Schema.Types.Mixed,
      required: true
    },
    wordDiff: {
      type: Schema.Types.Mixed,
      required: true
    },
    lineDiff: {
      type: Schema.Types.Mixed,
      required: true
    },
    sentenceDiff: {
      type: Schema.Types.Mixed,
      required: true
    }
  },
  statistics: {
    totalChanges: Number,
    additionsCount: Number,
    deletionsCount: Number,
    similarity: Number,
    changeTypes: Schema.Types.Mixed
  },
  options: {
    ignoreWhitespace: Boolean,
    ignoreCase: Boolean,
    comparisonType: String
  },
  comparisonType: {
    type: String,
    enum: ['text', 'html', 'markdown'],
    default: 'text'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [String],
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes for efficient queries
comparisonResultSchema.index({ userId: 1, createdAt: -1 });
comparisonResultSchema.index({ 'documents.original.id': 1 });
comparisonResultSchema.index({ 'documents.modified.id': 1 });

// Instance methods
comparisonResultSchema.methods.getSummary = function() {
  return {
    id: this.id,
    documents: this.documents,
    statistics: this.statistics,
    createdAt: this.createdAt,
    comparisonType: this.comparisonType
  };
};

comparisonResultSchema.methods.generateReport = function() {
  const stats = this.statistics;
  return {
    summary: `Documents are ${stats.similarity}% similar with ${stats.totalChanges} total changes`,
    details: {
      additions: stats.additionsCount,
      deletions: stats.deletionsCount,
      similarity: stats.similarity,
      changeBreakdown: stats.changeTypes
    },
    recommendations: this.generateRecommendations()
  };
};

comparisonResultSchema.methods.generateRecommendations = function() {
  const stats = this.statistics;
  const recommendations = [];

  if (stats.similarity < 50) {
    recommendations.push('Documents have significant differences. Consider a detailed review.');
  } else if (stats.similarity < 80) {
    recommendations.push('Documents have moderate differences. Review key sections.');
  } else {
    recommendations.push('Documents are very similar. Only minor changes detected.');
  }

  if (stats.additionsCount > stats.deletionsCount * 2) {
    recommendations.push('Significant content has been added. Review new sections carefully.');
  }

  if (stats.deletionsCount > stats.additionsCount * 2) {
    recommendations.push('Significant content has been removed. Ensure important information is not lost.');
  }

  return recommendations;
};

module.exports = mongoose.model('ComparisonResult', comparisonResultSchema);
