const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const documentSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
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
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'Template'
  },
  templateVersion: Number,
  category: String,
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'review', 'final', 'archived'],
    default: 'draft'
  },
  currentVersion: {
    type: Number,
    default: 1
  },
  isVersioned: {
    type: Boolean,
    default: true
  },
  collaborators: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'owner'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    wordCount: Number,
    characterCount: Number,
    lastEditedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    generatedVariables: Schema.Types.Mixed,
    exportHistory: [{
      format: String,
      exportedAt: Date,
      exportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  permissions: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    allowDownload: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
documentSchema.index({ userId: 1, status: 1, updatedAt: -1 });
documentSchema.index({ category: 1, tags: 1 });
documentSchema.index({ templateId: 1 });

// Virtual for document versions
documentSchema.virtual('versions', {
  ref: 'DocumentVersion',
  localField: '_id',
  foreignField: 'documentId'
});

// Pre-save middleware
documentSchema.pre('save', function(next) {
  if (this.content) {
    this.metadata = this.metadata || {};
    this.metadata.characterCount = this.content.length;
    this.metadata.wordCount = this.content.split(/\s+/).filter(word => word.length > 0).length;
  }
  next();
});

// Instance methods
documentSchema.methods.createVersion = async function(changeLog = '') {
  if (!this.isVersioned) return null;

  const DocumentVersion = require('./DocumentVersion');
  const nextVersion = this.currentVersion + 1;

  const version = new DocumentVersion({
    documentId: this._id,
    userId: this.userId,
    version: nextVersion,
    title: this.title,
    content: this.content,
    format: this.format,
    changeLog,
    tags: this.tags,
    metadata: {
      wordCount: this.metadata?.wordCount,
      characterCount: this.metadata?.characterCount,
      templateId: this.templateId,
      templateVersion: this.templateVersion,
      generatedVariables: this.metadata?.generatedVariables
    }
  });

  await version.save();
  
  this.currentVersion = nextVersion;
  await this.save();

  return version;
};

documentSchema.methods.getVersions = function() {
  const DocumentVersion = require('./DocumentVersion');
  return DocumentVersion.find({ documentId: this._id, userId: this.userId })
    .sort({ version: -1 })
    .select('-content'); // Exclude content for performance
};

documentSchema.methods.canEdit = function(userId) {
  if (this.userId.toString() === userId.toString()) return true;
  
  const collaborator = this.collaborators.find(
    c => c.user.toString() === userId.toString()
  );
  
  return collaborator && ['editor', 'owner'].includes(collaborator.role);
};

documentSchema.methods.canView = function(userId) {
  if (this.permissions?.isPublic) return true;
  if (this.userId.toString() === userId.toString()) return true;
  
  return this.collaborators.some(
    c => c.user.toString() === userId.toString()
  );
};

// Static methods
documentSchema.statics.findByUser = function(userId, query = {}) {
  return this.find({ userId, ...query })
    .sort({ updatedAt: -1 })
    .populate('templateId', 'name')
    .populate('collaborators.user', 'name email');
};

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
