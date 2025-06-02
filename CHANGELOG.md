# Changelog

All notable changes to the LegalNomican project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Input Validation**
  - Added `express-validator` for request validation
  - Implemented validation middleware for chat and document generation endpoints
  - Added centralized error handling for validation failures

- **Security Enhancements**
  - Added `express-mongo-sanitize` to prevent NoSQL injection
  - Added `xss-clean` for basic XSS protection (note: marked for future replacement)
  - Implemented input sanitization middleware for all incoming requests

### Changed
- **Memory Management**
  - Added automated cleanup for `uploadedDocumentContext` to prevent memory leaks
  - Implemented 24-hour TTL for document context entries

- **Code Organization**
  - Consolidated document parsing logic into `documentGenerationService.js`
  - Removed redundant code from `chatController.js`
  - Standardized error handling with new `handleError` utility

- **Project Configuration** (`package.json`):
  - Added `express-validator`, `express-mongo-sanitize`, and `xss-clean` as dependencies
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
