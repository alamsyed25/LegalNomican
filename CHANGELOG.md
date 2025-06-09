# Changelog

All notable changes to the LegalNomican project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Document Versioning System**
  - Added `DocumentVersion` model to track document history
  - Implemented version creation on document updates
  - Added endpoints to retrieve version history
  - Integrated with existing document management system

- **Document Comparison**
  - Added `ComparisonResult` model to store comparison data
  - Implemented `DocumentComparisonService` for diff calculations
  - Added endpoints for comparing documents and versions
  - Support for multiple diff algorithms (character, word, line, sentence)
  - Added comparison history and reporting

- **API Endpoints**
  - `POST /api/documents` - Create a new document
  - `PUT /api/documents/:id` - Update a document
  - `GET /api/documents/:id` - Get a document
  - `GET /api/documents/:id/versions` - Get document version history
  - `GET /api/compare/:documentId1` - Compare document with previous version
  - `GET /api/compare/:documentId1/:documentId2` - Compare two documents
  - `GET /api/compare/version/:versionId1/:versionId2` - Compare two specific versions
  - `GET /api/comparisons` - Get comparison history
  - `GET /api/comparisons/:id` - Get specific comparison result

- **Input Validation**
  - Added `express-validator` for request validation
  - Implemented validation middleware for all document and comparison endpoints
  - Added centralized error handling for validation failures

- **Security Enhancements**
  - Added `express-mongo-sanitize` to prevent NoSQL injection
  - Added `xss-clean` for basic XSS protection (note: marked for future replacement)
  - Implemented input sanitization middleware for all incoming requests

- **Template System**
  - Implemented robust `Template` model with sections, variables, and conditional rendering
  - Created comprehensive `templateService.js` for document template management with:
    - Template CRUD operations with versioning and soft-delete
    - Advanced validation for template structure, sections, and variables
    - Section-based template composition with conditional display logic
    - Support for multiple variable types (text, number, date, boolean, select)
    - Handlebars template engine integration with extended helper functions
    - Markdown processing capabilities using marked
    - Template categorization, tagging, and rating system
  - Implemented RESTful API routes in `templateRoutes.js` for all template operations
  - Added features for template discovery (categories, popular templates, tags)

- **Document Comparison System**
  - Added `documentComparisonService.js` for comprehensive document comparison with:
    - Multiple comparison types (character, word, line, sentence)
    - Detailed change tracking and statistics
    - Export functionality in multiple formats (HTML, JSON, CSV)
    - HTML visualization of differences with styling
  - Implemented `DocumentVersion` model for tracking document history and versions
  - Created `ComparisonResult` model for storing and retrieving comparison results
  - Added RESTful API routes in `documentComparisonRoutes.js` for comparison operations:
    - Compare any two documents
    - Compare specific document versions
    - Access comparison history
    - Export comparison results

- **Testing Framework**
  - Added Jest configuration with test environment setup
  - Implemented basic unit tests for `documentContextService.js` and `chatController.js`
  - Created test fixtures and mock data to support testing
  - Added test environment configuration with `.env.test`

- **MongoDB Connection Management**
  - Implemented robust MongoDB connection: singleton, environment-aware URI, pooling, auto-retry (dev/prod), graceful shutdown.
- **Chat Session API**
  - `GET /api/chat/session/:sessionId`: Retrieve session info, including document context status.
  - `POST /api/chat/clear-context`: Clear document context for a session.
- **Global Error Handling**
  - Centralized error handling with `globalErrorHandler`, `notFoundHandler`, and `validationErrorHandler` middleware.
  - `asyncHandler` wrapper for cleaner async controller logic.
- **Document Service (`DocumentService`)**
  - New service for unified document processing: text extraction (PDF, DOCX, DOC, TXT), file validation, and type info.

### Changed
- **Memory Management**
  - Added automated cleanup for `uploadedDocumentContext` to prevent memory leaks
  - Implemented 24-hour TTL for document context entries

- **CSS Modularization**
  - Split large `enhanced-hero.css` (611 lines) into 5 modular files:
    - `hero-base.css`: Base styles and typography
    - `hero-metrics.css`: Trust and feature metrics styling
    - `hero-demo.css`: Demo card and interactive components
    - `hero-animations.css`: All animation keyframes
    - `hero-responsive.css`: Media queries and responsive adjustments
  - Split large `styles.css` (618 lines) into 6 modular files:
    - `core-variables.css`: Design system variables
    - `typography.css`: Text and font styling
    - `layout.css`: Grid systems and containers
    - `buttons.css`: Button variants and controls
    - `forms.css`: Form elements and inputs
    - `features.css`: Feature cards and sections
    - `responsive.css`: All media queries
  - Created main import files for modular CSS components

- **Code Organization**
  - Consolidated Redis operations into new `documentContextService.js` service
  - Refactored `chatController.js` to use the new service
  - Enhanced `setup.js` script with environment validation
  - Consolidated document parsing logic into `documentGenerationService.js`
  - Removed redundant code from `chatController.js`
  - Standardized error handling with new `handleError` utility

- **Chat Controller (`chatController.js`)**
  - Refactored to use `DocumentService` for uploads, validation, and text extraction.
  - Stores enhanced document metadata (file size, file type) in Redis.
  - Returns detailed session and document info.
  - Integrated `asyncHandler` for all routes.
- **Document Processing**
  - Text extraction logic consolidated into `DocumentService`.
  - Removed `extractTextFromBuffer` from `documentGenerationService.js`.
- **Middleware**
  - Replaced old `validationHandler.js` with `validationErrorHandler` in `errorMiddleware.js`.
  - Updated `chatRoutes.js` to use new `validationErrorHandler`.

- **Project Configuration** (`package.json`):
  - Added `express-validator`, `express-mongo-sanitize`, `xss-clean`, `marked`, and `handlebars` as dependencies
  - Added `setup` script: `node scripts/setup.js`
  - Updated dependency versions for `multer`, `mammoth`, `joi`, `bcryptjs`, and `jsonwebtoken`
  - Ensured all core dependencies like `compression`, `cors`, `dotenv`, `express`, `express-rate-limit`, `helmet`, `mongoose`, and `pdf-parse` are correctly listed

### Fixed
- **Bug Fixes**
  - Fixed memory leak in chat session handling
  - Corrected error response format in validation middleware
  - Ensured consistent error handling across all API endpoints


## [0.2.0] - 2025-05-31
### Added
- **Document Service**
  - Implemented `documentService.js` with text extraction from PDF, Word, and text files
  - Added file validation for size and MIME types
  - Included proper error handling and temporary file cleanup
  - Added JSDoc documentation for all functions
  - Implemented file cleanup on error conditions

- **Research Service**
  - Added `researchService.js` for legal research functionality
  - Implemented mock data generation for development
  - Added citation analysis with validity checking
  - Included sample case law and statutes
  - Added support for research options (jurisdiction, date range)

### Changed
- **UI/UX**
  - Redesigned security features section with a 2x2 grid layout
  - Updated icons to more modern and professional alternatives:
    - Replaced `fa-shield-alt` with `fa-building-shield` for Enterprise Security
    - Replaced `fa-lock` with `fa-key` for End-to-End Encryption
    - Replaced `fa-user-shield` with `fa-users-cog` for Role-Based Access Control
    - Replaced `fa-clipboard-list` with `fa-history` for Audit Logs
  - Improved responsive design for security section

- **Project Structure**
  - Organized services into dedicated modules
  - Improved code documentation and type hints
  - Standardized error handling patterns

### Removed
- **Project Cleanup**
  - Deleted orphaned `LegalNomican/LegalNomican/` directory containing duplicate files
  - Removed unused pricing-related CSS (178 lines) from main `styles.css`
  - Deleted old, unlinked `index.html` and `styles.css` files from the orphaned directory

### Fixed
- **Code Organization**
  - Moved all pricing-related styles to `pricing.css`
  - Consolidated duplicate CSS rules
  - Ensured proper file structure following project conventions
  - Fixed import paths and module exports

## [0.1.0] - 2025-05-31
### Added
- Initial project setup
- Basic file structure and configuration
- Core HTML/CSS templates
- Basic routing and navigation

[Unreleased]: https://github.com/yourusername/LegalNomican/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/yourusername/LegalNomican/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/yourusername/LegalNomican/releases/tag/v0.1.0
