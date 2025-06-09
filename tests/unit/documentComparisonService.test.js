const mongoose = require('mongoose');
const DocumentComparisonService = require('../../server/services/documentComparisonService').default;
const { setupTestDB, teardownTestDB } = require('../setup');

describe('Document Comparison Service', () => {
    beforeAll(async () => {
    await setupTestDB();
  });
  
  const comparisonService = DocumentComparisonService;

  afterAll(async () => {
    await teardownTestDB();
    await mongoose.connection.close();
  });

  describe('compareDocuments', () => {
    it('should compare two text documents and return differences', async () => {
      const doc1 = 'This is the original text.';
      const doc2 = 'This is the modified text.';

      const result = await comparisonService.compareDocuments(doc1, doc2);

      expect(result).toBeDefined();
      expect(result.comparison).toBeDefined();
      expect(result.comparison.wordDiff).toBeDefined();
      expect(result.comparison.lineDiff).toBeDefined();
      expect(result.statistics).toBeDefined();
      expect(result.statistics.similarity).toBeDefined();
    });
  });

  describe('getWordDiff', () => {
    it('should return word-level differences between texts', () => {
      const text1 = 'The quick brown fox';
      const text2 = 'The fast brown fox';

      const diff = comparisonService.getWordDiff(text1, text2);

      expect(diff).toBeDefined();
      expect(diff.type).toBe('word');
      expect(diff.changes.length).toBeGreaterThan(0);
      expect(diff.summary).toBeDefined();
    });
  });

  describe('generateHTMLDiff', () => {
    it('should generate HTML diff view', () => {
      const comparison = {
        comparison: {
          wordDiff: {
            changes: [
              { value: 'Hello', added: undefined, removed: undefined },
              { value: 'world', added: true, removed: undefined },
              { value: '!', added: undefined, removed: true },
              { value: '!', added: true, removed: undefined }
            ]
          }
        },
        statistics: {
          similarity: '80.00',
          additionsCount: 1,
          deletionsCount: 1,
          totalChanges: 2
        }
      };

      const html = comparisonService.generateHTMLDiff(comparison);

      expect(html).toBeDefined();
      expect(html).toContain('diff-container');
      expect(html).toContain('diff-added');
      expect(html).toContain('diff-removed');
    });
  });

  describe('exportComparison', () => {
    it('should export comparison as JSON', async () => {
      const comparison = {
        id: 'test-comparison',
        documents: {
          original: { title: 'Original' },
          modified: { title: 'Modified' }
        },
        comparison: {
          wordDiff: {
            changes: [{ value: 'test', added: true }]
          }
        },
        statistics: { similarity: '100.00' }
      };

      const result = await comparisonService.exportComparison(comparison, 'json');
      const parsed = JSON.parse(result);
      
      expect(parsed).toBeDefined();
      expect(parsed.id).toBe('test-comparison');
    });
  });
});
