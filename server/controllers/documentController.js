const Document = require('../models/Document');
const DocumentVersion = require('../models/DocumentVersion');
const ComparisonResult = require('../models/ComparisonResult');
const DocumentComparisonService = require('../services/documentComparisonService');
const errorHandler = require('../utils/errorHandler');
const AppError = errorHandler.AppError;

class DocumentController {
  // Create a new document
  static async createDocument(req, res, next) {
    try {
      const { title, content, format = 'html', templateId, category, tags = [] } = req.body;
      const userId = req.user._id;

      const document = new Document({
        title,
        content,
        format,
        userId,
        templateId,
        category,
        tags,
        metadata: {
          lastEditedBy: userId
        }
      });

      await document.save();

      // Create initial version
      if (document.isVersioned) {
        await document.createVersion('Initial version');
      }

      res.status(201).json({
        status: 'success',
        data: {
          document
        }
      });
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }


  // Update a document
  static async updateDocument(req, res, next) {
    try {
      const { id } = req.params;
      const { content, title, changeLog = 'Updated document', ...updates } = req.body;
      const userId = req.user._id;

      const document = await Document.findById(id);
      if (!document) {
        return next(new AppError('Document not found', 404));
      }

      if (!document.canEdit(userId)) {
        return next(new AppError('Not authorized to edit this document', 403));
      }

      // Save current content before updating
      const previousContent = document.content;
      
      // Update document
      if (content !== undefined) document.content = content;
      if (title) document.title = title;
      
      // Update other fields
      Object.keys(updates).forEach(key => {
        if (key in document) {
          document[key] = updates[key];
        }
      });

      document.metadata.lastEditedBy = userId;
      await document.save();

      // Create new version if content changed
      if (document.isVersioned && content !== undefined && content !== previousContent) {
        await document.createVersion(changeLog);
      }

      res.json({
        status: 'success',
        data: {
          document
        }
      });
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }

  // Get document by ID
  static async getDocument(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const document = await Document.findById(id);
      
      if (!document) {
        return next(new AppError('Document not found', 404));
      }

      if (!document.canView(userId)) {
        return next(new AppError('Not authorized to view this document', 403));
      }

      res.json({
        status: 'success',
        data: {
          document
        }
      });
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }

  // Get document versions
  static async getDocumentVersions(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const document = await Document.findById(id);
      if (!document) {
        return next(new AppError('Document not found', 404));
      }

      if (!document.canView(userId)) {
        return next(new AppError('Not authorized to view this document', 403));
      }

      const versions = await document.getVersions();

      res.json({
        status: 'success',
        results: versions.length,
        data: {
          versions
        }
      });
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }

  // Compare two documents or versions
  static async compareDocuments(req, res, next) {
    try {
      const { documentId1, versionId1, documentId2, versionId2 } = req.params;
      const userId = req.user._id;
      const options = {
        ignoreWhitespace: req.query.ignoreWhitespace === 'true',
        ignoreCase: req.query.ignoreCase === 'true',
        comparisonType: req.query.type || 'text'
      };

      // Get the first document/version
      let doc1;
      if (versionId1) {
        doc1 = await DocumentVersion.findOne({ _id: versionId1, userId });
      } else {
        doc1 = await Document.findOne({ _id: documentId1, userId });
      }

      // Get the second document/version
      let doc2;
      if (versionId2) {
        doc2 = await DocumentVersion.findOne({ _id: versionId2, userId });
      } else if (documentId2) {
        doc2 = await Document.findOne({ _id: documentId2, userId });
      } else {
        // If only one document is provided, compare with its previous version
        const versions = await DocumentVersion.find({ documentId: documentId1, userId })
          .sort({ version: -1 })
          .limit(2);
        
        if (versions.length < 2) {
          return next(new AppError('Not enough versions to compare', 400));
        }
        
        doc1 = versions[1]; // Previous version
        doc2 = versions[0]; // Current version
      }

      if (!doc1 || !doc2) {
        return next(new AppError('One or both documents/versions not found', 404));
      }

      // Check permissions
      const doc1Base = await Document.findById(doc1.documentId || doc1._id);
      const doc2Base = await Document.findById(doc2.documentId || doc2._id);
      
      if (!doc1Base.canView(userId) || (doc2Base && !doc2Base.canView(userId))) {
        return next(new AppError('Not authorized to view one or both documents', 403));
      }

      // Perform comparison
      const comparison = await DocumentComparisonService.compareDocuments(doc1, doc2, {
        ...options,
        userId
      });

      // Save comparison result
      const result = new ComparisonResult({
        id: comparison.id,
        userId,
        documents: {
          original: {
            title: doc1.title,
            length: doc1.content.length,
            type: doc1.format || 'text',
            lastModified: doc1.updatedAt || doc1.createdAt,
            id: doc1._id
          },
          modified: {
            title: doc2.title,
            length: doc2.content.length,
            type: doc2.format || 'text',
            lastModified: doc2.updatedAt || doc2.createdAt,
            id: doc2._id
          }
        },
        comparison: comparison.comparison,
        statistics: comparison.statistics,
        options: {
          ignoreWhitespace: options.ignoreWhitespace,
          ignoreCase: options.ignoreCase,
          comparisonType: options.comparisonType
        },
        comparisonType: options.comparisonType,
        isPublic: false
      });

      await result.save();

      res.json({
        status: 'success',
        data: {
          comparison: result
        }
      });
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }

  // Get comparison by ID
  static async getComparison(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const comparison = await ComparisonResult.findOne({
        _id: id,
        $or: [
          { userId },
          { isPublic: true }
        ]
      });

      if (!comparison) {
        return next(new AppError('Comparison not found or not authorized', 404));
      }

      res.json({
        status: 'success',
        data: {
          comparison
        }
      });
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }

  // Get user's comparison history
  static async getComparisonHistory(req, res, next) {
    try {
      const userId = req.user._id;
      const { limit = 10, page = 1 } = req.query;
      const skip = (page - 1) * limit;

      const comparisons = await ComparisonResult.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await ComparisonResult.countDocuments({ userId });

      res.json({
        status: 'success',
        results: comparisons.length,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        data: {
          comparisons
        }
      });
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }
}

module.exports = DocumentController;
