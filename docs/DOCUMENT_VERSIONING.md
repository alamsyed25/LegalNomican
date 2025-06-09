# Document Versioning and Comparison

This document outlines the document versioning and comparison features implemented in the LegalNomican application.

## Features

### Document Versioning
- Automatic version creation on document updates
- Version history tracking with change logs
- Support for manual version creation
- Metadata tracking (word count, character count, etc.)

### Document Comparison
- Side-by-side document comparison
- Multiple diff algorithms (character, word, line, sentence)
- Detailed change statistics
- Comparison history
- Exportable comparison reports

## API Endpoints

### Document Management

#### Create a New Document
```
POST /api/documents
```

**Request Body:**
```json
{
  "title": "Document Title",
  "content": "Document content",
  "format": "plain",
  "tags": ["tag1", "tag2"],
  "isVersioned": true
}
```

#### Update a Document
```
PUT /api/documents/:id
```

**Request Body:**
```json
{
  "content": "Updated content",
  "changeLog": "What changed in this version"
}
```

#### Get Document Versions
```
GET /api/documents/:id/versions
```

### Document Comparison

#### Compare Two Documents
```
GET /api/compare/:documentId1/:documentId2
```

#### Compare Document with Previous Version
```
GET /api/compare/:documentId1
```

#### Compare Specific Versions
```
GET /api/compare/version/:versionId1/:versionId2
```

#### Get Comparison History
```
GET /api/comparisons
```

#### Get Specific Comparison Result
```
GET /api/comparisons/:id
```

## Data Models

### Document
```javascript
{
  _id: ObjectId,
  title: String,
  content: String,
  format: String, // 'html', 'markdown', 'plain'
  userId: ObjectId,
  templateId: ObjectId,
  templateVersion: Number,
  category: String,
  tags: [String],
  status: String, // 'draft', 'review', 'final', 'archived'
  currentVersion: Number,
  isVersioned: Boolean,
  collaborators: [{
    user: ObjectId,
    role: String, // 'viewer', 'editor', 'owner'
    addedAt: Date
  }],
  metadata: {
    wordCount: Number,
    characterCount: Number,
    lastEditedBy: ObjectId,
    generatedVariables: Mixed,
    exportHistory: [{
      format: String,
      exportedAt: Date,
      exportedBy: ObjectId
    }]
  },
  permissions: {
    isPublic: Boolean,
    allowComments: Boolean,
    allowDownload: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### DocumentVersion
```javascript
{
  _id: ObjectId,
  documentId: ObjectId,
  userId: ObjectId,
  version: Number,
  title: String,
  content: String,
  format: String, // 'html', 'markdown', 'plain'
  changeLog: String,
  tags: [String],
  metadata: {
    wordCount: Number,
    characterCount: Number,
    templateId: ObjectId,
    templateVersion: Number,
    generatedVariables: Mixed
  },
  isAutoSave: Boolean,
  parentVersion: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### ComparisonResult
```javascript
{
  _id: ObjectId,
  id: String,
  userId: ObjectId,
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
    characterDiff: Mixed,
    wordDiff: Mixed,
    lineDiff: Mixed,
    sentenceDiff: Mixed
  },
  statistics: {
    totalChanges: Number,
    additionsCount: Number,
    deletionsCount: Number,
    similarity: Number,
    changeTypes: Mixed
  },
  options: {
    ignoreWhitespace: Boolean,
    ignoreCase: Boolean,
    comparisonType: String
  },
  comparisonType: String, // 'text', 'html', 'markdown'
  isPublic: Boolean,
  tags: [String],
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Usage Examples

### Creating a New Document with Versioning
```javascript
const response = await fetch('/api/documents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    title: 'Sample Document',
    content: 'This is the initial content',
    format: 'markdown',
    tags: ['sample', 'test']
  })
});
```

### Updating a Document (Creates New Version)
```javascript
const response = await fetch(`/api/documents/${documentId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    content: 'This is the updated content',
    changeLog: 'Updated the sample content'
  })
});
```

### Comparing Two Versions
```javascript
const response = await fetch(`/api/compare/version/${version1Id}/${version2Id}`, {
  headers: {
    'Authorization': `Bearer ${authToken}`
  }
});

const comparison = await response.json();
console.log('Similarity:', comparison.data.comparison.statistics.similarity + '%');
```

## Error Handling

The API returns appropriate HTTP status codes and error messages in the following format:

```json
{
  "status": "error",
  "message": "Error message",
  "code": "ERROR_CODE",
  "details": {
    // Additional error details
  }
}
```

Common error codes:
- `AUTH_REQUIRED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Request validation failed
- `VERSION_CONFLICT`: Version conflict detected

## Rate Limiting

API endpoints are rate limited to prevent abuse. The current limits are:
- 100 requests per 15 minutes per IP for document creation/updates
- 1000 requests per 15 minutes per IP for document retrieval

## Security Considerations

- All document operations require authentication
- Users can only access documents they own or have been shared with them
- Sensitive operations (deletion, permission changes) require additional confirmation
- All user input is sanitized to prevent XSS and NoSQL injection

## Performance Considerations

- Document versions are stored as separate documents for better performance
- Large documents are processed in chunks to prevent memory issues
- Comparison results are cached for frequently compared documents
- Pagination is implemented for version history and comparison lists

## Testing

Run the test suite with:

```bash
npm test tests/documentVersioning.test.js
```

## Dependencies

- `mongoose`: MongoDB ODM
- `diff`: For calculating differences between documents
- `express-validator`: Request validation
- `xss-clean`: Input sanitization (to be replaced with DOMPurify)

## Future Enhancements

1. Real-time collaboration with operational transforms
2. More granular permission system
3. Document templates with versioning
4. Offline support with conflict resolution
5. Advanced diff visualization
6. Integration with version control systems (Git)
7. Document branching and merging
8. Bulk operations on multiple documents
9. Advanced search across document versions
10. Automated document classification and tagging
