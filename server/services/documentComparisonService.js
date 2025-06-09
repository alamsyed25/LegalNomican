const diff = require('diff');
const cheerio = require('cheerio');
const DocumentVersion = require('../models/DocumentVersion');
const ComparisonResult = require('../models/ComparisonResult');

class DocumentComparisonService {
  constructor() {
    this.diffOptions = {
      ignoreWhitespace: false,
      ignoreCase: false,
      newlineIsToken: true
    };
  }

  // Compare two documents and return detailed diff
  async compareDocuments(doc1, doc2, options = {}) {
    try {
      const {
        ignoreWhitespace = false,
        ignoreCase = false,
        comparisonType = 'text',
        userId
      } = options;

      // Normalize documents based on type
      const normalizedDoc1 = this.normalizeDocument(doc1, comparisonType);
      const normalizedDoc2 = this.normalizeDocument(doc2, comparisonType);

      // Configure diff options
      const diffOptions = {
        ...this.diffOptions,
        ignoreWhitespace,
        ignoreCase
      };

      // Perform different types of comparisons
      const comparison = {
        characterDiff: this.getCharacterDiff(normalizedDoc1, normalizedDoc2, diffOptions),
        wordDiff: this.getWordDiff(normalizedDoc1, normalizedDoc2, diffOptions),
        lineDiff: this.getLineDiff(normalizedDoc1, normalizedDoc2, diffOptions),
        sentenceDiff: this.getSentenceDiff(normalizedDoc1, normalizedDoc2, diffOptions)
      };

      // Calculate statistics
      const stats = this.calculateDiffStats(comparison);

      // Create comparison result
      const result = {
        id: this.generateComparisonId(),
        timestamp: new Date(),
        documents: {
          original: this.getDocumentInfo(doc1),
          modified: this.getDocumentInfo(doc2)
        },
        comparison,
        statistics: stats,
        options: diffOptions,
        comparisonType
      };

      // Save comparison result if user is provided
      if (userId) {
        await this.saveComparisonResult(result, userId);
      }

      return result;
    } catch (error) {
      throw new Error(`Document comparison failed: ${error.message}`);
    }
  }

  // Get character-level diff
  getCharacterDiff(text1, text2, options) {
    const diff = require('diff').diffChars(text1, text2, options);
    return this.processDiffResult(diff, 'character');
  }

  // Get word-level diff
  getWordDiff(text1, text2, options) {
    const diff = require('diff').diffWords(text1, text2, options);
    return this.processDiffResult(diff, 'word');
  }

  // Get line-level diff
  getLineDiff(text1, text2, options) {
    const diff = require('diff').diffLines(text1, text2, options);
    return this.processDiffResult(diff, 'line');
  }

  // Get sentence-level diff
  getSentenceDiff(text1, text2, options) {
    const diff = require('diff').diffSentences(text1, text2, options);
    return this.processDiffResult(diff, 'sentence');
  }

  // Process diff result and add metadata
  processDiffResult(diffResult, type) {
    const processed = diffResult.map((part, index) => ({
      id: `${type}-${index}`,
      type,
      operation: part.added ? 'add' : part.removed ? 'remove' : 'equal',
      content: part.value,
      count: part.count || part.value.length,
      added: part.added || false,
      removed: part.removed || false
    }));

    return {
      type,
      changes: processed,
      summary: this.summarizeDiff(processed)
    };
  }

  // Summarize diff results
  summarizeDiff(changes) {
    const summary = {
      total: changes.length,
      additions: changes.filter(c => c.added).length,
      deletions: changes.filter(c => c.removed).length,
      unchanged: changes.filter(c => !c.added && !c.removed).length,
      addedContent: changes.filter(c => c.added).map(c => c.content).join(''),
      removedContent: changes.filter(c => c.removed).map(c => c.content).join('')
    };

    summary.changePercentage = summary.total > 0 
      ? ((summary.additions + summary.deletions) / summary.total * 100).toFixed(2)
      : 0;

    return summary;
  }

  // Calculate overall statistics
  calculateDiffStats(comparison) {
    const stats = {
      totalChanges: 0,
      additionsCount: 0,
      deletionsCount: 0,
      similarity: 0,
      changeTypes: {}
    };

    Object.keys(comparison).forEach(type => {
      const diff = comparison[type];
      stats.totalChanges += diff.summary.additions + diff.summary.deletions;
      stats.additionsCount += diff.summary.additions;
      stats.deletionsCount += diff.summary.deletions;
      
      stats.changeTypes[type] = {
        additions: diff.summary.additions,
        deletions: diff.summary.deletions,
        changePercentage: diff.summary.changePercentage
      };
    });

    // Calculate similarity percentage (using word diff as base)
    const wordDiff = comparison.wordDiff;
    const totalWords = wordDiff.changes.length;
    const unchangedWords = wordDiff.summary.unchanged;
    stats.similarity = totalWords > 0 ? (unchangedWords / totalWords * 100).toFixed(2) : 100;

    return stats;
  }

  // Normalize document content based on type
  normalizeDocument(doc, type) {
    let content = '';

    if (typeof doc === 'string') {
      content = doc;
    } else if (doc.content) {
      content = doc.content;
    } else if (doc.text) {
      content = doc.text;
    } else {
      throw new Error('Invalid document format');
    }

    // Remove HTML tags if comparing plain text
    if (type === 'text' && this.containsHTML(content)) {
      content = this.stripHTML(content);
    }

    return content;
  }

  // Check if content contains HTML
  containsHTML(content) {
    return /<[^>]*>/g.test(content);
  }

  // Strip HTML tags from content
  stripHTML(content) {
    const $ = cheerio.load(content);
    return $.text();
  }

  // Get document information
  getDocumentInfo(doc) {
    return {
      title: doc.title || 'Untitled Document',
      length: (doc.content || doc.text || doc).length,
      type: doc.type || 'unknown',
      lastModified: doc.lastModified || doc.updatedAt || new Date(),
      id: doc.id || doc._id
    };
  }

  // Generate unique comparison ID
  generateComparisonId() {
    return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save comparison result to database
  async saveComparisonResult(result, userId) {
    try {
      const comparisonResult = new ComparisonResult({
        ...result,
        userId,
        createdAt: new Date()
      });

      await comparisonResult.save();
      return comparisonResult;
    } catch (error) {
      console.error('Failed to save comparison result:', error);
      // Don't throw error - comparison should still work without saving
    }
  }

  // Get comparison history for user
  async getComparisonHistory(userId, options = {}) {
    try {
      const { limit = 20, skip = 0, sortBy = 'createdAt', sortOrder = -1 } = options;

      const comparisons = await ComparisonResult.find({ userId })
        .sort({ [sortBy]: sortOrder })
        .limit(limit)
        .skip(skip)
        .select('-comparison.characterDiff -comparison.wordDiff') // Exclude large diff data
        .lean();

      return comparisons;
    } catch (error) {
      throw new Error(`Failed to get comparison history: ${error.message}`);
    }
  }

  // Get specific comparison result
  async getComparisonResult(comparisonId, userId) {
    try {
      const result = await ComparisonResult.findOne({
        id: comparisonId,
        userId
      });

      if (!result) {
        throw new Error('Comparison result not found');
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to get comparison result: ${error.message}`);
    }
  }

  // Compare document versions
  async compareVersions(documentId, version1, version2, userId) {
    try {
      const doc1 = await DocumentVersion.findOne({
        documentId,
        version: version1,
        userId
      });

      const doc2 = await DocumentVersion.findOne({
        documentId,
        version: version2,
        userId
      });

      if (!doc1 || !doc2) {
        throw new Error('One or both document versions not found');
      }

      return await this.compareDocuments(doc1, doc2, { userId });
    } catch (error) {
      throw new Error(`Failed to compare versions: ${error.message}`);
    }
  }

  // Generate HTML diff view
  generateHTMLDiff(comparison, options = {}) {
    const { diffType = 'wordDiff', showStats = true, theme = 'default' } = options;
    
    if (!comparison.comparison[diffType]) {
      throw new Error(`Invalid diff type: ${diffType}`);
    }

    const diff = comparison.comparison[diffType];
    const changes = diff.changes;

    let html = `<div class="diff-container diff-theme-${theme}">`;
    
    if (showStats) {
      html += this.generateStatsHTML(comparison.statistics);
    }

    html += '<div class="diff-content">';
    
    changes.forEach(change => {
      const cssClass = change.added ? 'diff-added' : 
                      change.removed ? 'diff-removed' : 'diff-unchanged';
      
      html += `<span class="${cssClass}" data-change-id="${change.id}">`;
      html += this.escapeHTML(change.content);
      html += '</span>';
    });

    html += '</div></div>';

    return html;
  }

  // Generate statistics HTML
  generateStatsHTML(stats) {
    return `
      <div class="diff-stats">
        <div class="stat-item">
          <span class="stat-label">Similarity:</span>
          <span class="stat-value">${stats.similarity}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Additions:</span>
          <span class="stat-value stat-additions">${stats.additionsCount}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Deletions:</span>
          <span class="stat-value stat-deletions">${stats.deletionsCount}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Changes:</span>
          <span class="stat-value">${stats.totalChanges}</span>
        </div>
      </div>
    `;
  }

  // Escape HTML for safe display
  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Export comparison result
  async exportComparison(comparisonId, format, userId) {
    try {
      const comparison = await this.getComparisonResult(comparisonId, userId);
      
      switch (format.toLowerCase()) {
        case 'json':
          return JSON.stringify(comparison, null, 2);
        case 'html':
          return this.generateHTMLDiff(comparison, { showStats: true });
        case 'csv':
          return this.generateCSVDiff(comparison);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      throw new Error(`Failed to export comparison: ${error.message}`);
    }
  }

  // Generate CSV format for diff
  generateCSVDiff(comparison) {
    const changes = comparison.comparison.wordDiff.changes;
    const csvLines = ['Operation,Content,Type'];
    
    changes.forEach(change => {
      const operation = change.added ? 'ADD' : change.removed ? 'REMOVE' : 'UNCHANGED';
      const content = change.content.replace(/"/g, '""'); // Escape quotes
      csvLines.push(`"${operation}","${content}","${change.type}"`);
    });

    return csvLines.join('\n');
  }
}

module.exports = new DocumentComparisonService();
