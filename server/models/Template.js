// models/Template.js
const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isOptional: {
    type: Boolean,
    default: false
  },
  conditions: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  order: {
    type: Number,
    default: 0
  }
});

const variableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'number', 'date', 'boolean', 'select'],
    default: 'text'
  },
  label: {
    type: String,
    required: true
  },
  description: String,
  required: {
    type: Boolean,
    default: false
  },
  defaultValue: mongoose.Schema.Types.Mixed,
  options: [String], // For select type
  validation: {
    pattern: String,
    minLength: Number,
    maxLength: Number,
    min: Number,
    max: Number
  }
});

const templateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
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
  category: {
    type: String,
    required: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    index: true
  }],
  sections: [sectionSchema],
  variables: [variableSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  version: {
    type: Number,
    default: 1
  },
  parentTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template'
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  metadata: {
    language: {
      type: String,
      default: 'en'
    },
    jurisdiction: String,
    documentType: String,
    complexity: {
      type: String,
      enum: ['basic', 'intermediate', 'advanced'],
      default: 'basic'
    }
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes for better performance
templateSchema.index({ createdBy: 1, isActive: 1 });
templateSchema.index({ category: 1, isPublic: 1, isActive: 1 });
templateSchema.index({ tags: 1, isActive: 1 });
templateSchema.index({ 'rating.average': -1, usageCount: -1 });

// Virtual for getting all versions
templateSchema.virtual('versions', {
  ref: 'Template',
  localField: '_id',
  foreignField: 'parentTemplate'
});

// Pre-save middleware
templateSchema.pre('save', function(next) {
  if (this.isNew) {
    this.usageCount = 0;
  }
  next();
});

// Instance methods
templateSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

templateSchema.methods.addRating = function(rating) {
  const currentTotal = this.rating.average * this.rating.count;
  this.rating.count += 1;
  this.rating.average = (currentTotal + rating) / this.rating.count;
  return this.save();
};

templateSchema.methods.isOwnedBy = function(userId) {
  return this.createdBy.toString() === userId.toString();
};

templateSchema.methods.canAccess = function(userId) {
  return this.isPublic || this.isOwnedBy(userId);
};

// Static methods
templateSchema.statics.findByCategory = function(category, isPublic = null) {
  const query = { category, isActive: true };
  if (isPublic !== null) {
    query.isPublic = isPublic;
  }
  return this.find(query);
};

templateSchema.statics.findPopular = function(limit = 10) {
  return this.find({ isActive: true, isPublic: true })
    .sort({ usageCount: -1, 'rating.average': -1 })
    .limit(limit);
};

templateSchema.statics.searchTemplates = function(searchTerm, options = {}) {
  const { category, tags, userId } = options;
  
  const query = {
    isActive: true,
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ]
  };

  if (userId) {
    query.$or = [
      { ...query, createdBy: userId },
      { ...query, isPublic: true }
    ];
  } else {
    query.isPublic = true;
  }

  if (category) {
    query.category = category;
  }

  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }

  return this.find(query);
};

module.exports = mongoose.model('Template', templateSchema);
