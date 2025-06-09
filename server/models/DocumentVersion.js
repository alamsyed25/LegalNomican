const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const documentVersionSchema = new Schema({
  documentId: {
    type: Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  version: {
    type: Number,
    required: true,
    min: 1
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  format: {
    type: String,
    enum: ['html', 'markdown', 'plain'],
    default: 'html'
  },
  changeLog: {
    type: String,
    trim: true
  },
  tags: [String],
  metadata: {
    wordCount: Number,
    characterCount: Number,
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'Template'
    },
    templateVersion: Number,
    generatedVariables: Schema.Types.Mixed
  },
  isAutoSave: {
    type: Boolean,
    default: false
  },
  parentVersion: {
    type: Schema.Types.ObjectId,
    ref: 'DocumentVersion'
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index to ensure uniqueness of document versions
documentVersionSchema.index({ documentId: 1, version: 1 }, { unique: true });

// Static method to get the latest version of a document
documentVersionSchema.statics.getLatestVersion = async function(documentId) {
  return this.findOne({ documentId })
    .sort({ version: -1 })
    .exec();
};

// Static method to get all versions for a document
documentVersionSchema.statics.getVersionHistory = async function(documentId, userId) {
  return this.find({ documentId, userId })
    .sort({ version: -1 })
    .exec();
};

// Instance method to compare this version with another version
documentVersionSchema.methods.getDiff = function(otherVersion) {
  const DocumentComparisonService = require('../services/documentComparisonService');
  return DocumentComparisonService.compareDocuments(this, otherVersion);
};

// Static method to create a new version
documentVersionSchema.statics.createNewVersion = async function(documentId, userId, data) {
  // Get the latest version
  const latestVersion = await this.getLatestVersion(documentId);
  const nextVersion = latestVersion ? latestVersion.version + 1 : 1;
  
  // Create new version
  const newVersion = new this({
    documentId,
    userId,
    version: nextVersion,
    title: data.title,
    content: data.content,
    format: data.format,
    metadata: {
      changeDescription: data.changeDescription || `Version ${nextVersion}`,
      changedFields: data.changedFields || [],
      changeCount: data.changeCount || 0,
      wordCount: data.content.split(/\s+/).length,
      changedBy: data.changedBy || userId
    }
  });
  
  await newVersion.save();
  return newVersion;
};

// Indexes
documentVersionSchema.index({ documentId: 1, version: -1 });
documentVersionSchema.index({ userId: 1, createdAt: -1 });

// Pre-save middleware
documentVersionSchema.pre('save', function(next) {
  if (this.content) {
    this.metadata = this.metadata || {};
    this.metadata.characterCount = this.content.length;
    this.metadata.wordCount = this.content.split(/\s+/).filter(word => word.length > 0).length;
  }
  next();
});

// Static method to get version history
documentVersionSchema.statics.getVersionHistory = function(documentId, userId) {
  return this.find({ documentId, userId })
    .sort({ version: -1 })
    .select('-content'); // Exclude content for performance
};

// Static method to get latest version
documentVersionSchema.statics.getLatestVersion = function(documentId, userId) {
  return this.findOne({ documentId, userId })
    .sort({ version: -1 });
};

// Instance method to get next version number
documentVersionSchema.methods.getNextVersion = async function() {
  const latestVersion = await this.constructor.findOne({
    documentId: this.documentId
  }).sort({ version: -1 });
  
  return latestVersion ? latestVersion.version + 1 : 1;
};

const DocumentVersion = mongoose.model('DocumentVersion', documentVersionSchema);

module.exports = DocumentVersion;
