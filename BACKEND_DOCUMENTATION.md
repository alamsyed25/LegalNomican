# LegalNomican Backend Documentation

This document provides an overview of the backend architecture, features, and key components of the LegalNomican application.

## 1. Project Structure

The backend follows a modular structure to promote separation of concerns, maintainability, and scalability. Key directories within the `server` folder (unless specified otherwise) include:

-   `config/`: Contains environment-specific configurations (development, testing, production) and database connection settings.
-   `models/`: Defines Mongoose schemas for database collections (e.g., User, ChatSession, Document).
-   `controllers/`: Houses the business logic for different features. Each controller handles requests, interacts with services/models, and sends responses.
    -   `chatController.js`: Manages chatbot interactions, message handling, document uploads, and context management.
    -   `documentGenerationController.js`: Handles requests for generating legal documents based on templates and user data.
    -   `authController.js`: (Assumed, to be added/confirmed for future user authentication and authorization).
-   `routes/`: Defines API endpoints and maps them to controller functions. Express router is used for modular routing.
    -   `chatRoutes.js`: Routes related to chatbot functionalities.
    -   `documentRoutes.js`: Routes for document generation.
    -   `authRoutes.js`: (Assumed for future user authentication).
-   `services/`: Contains services that encapsulate specific business logic or interact with external systems.
    -   `documentService.js`: A unified service for document handling. Responsible for text extraction from various file types (PDF, DOCX, DOC, TXT) using buffers, file validation (size, MIME type), and providing file type metadata.
    -   `documentGenerationService.js`: Logic for parsing document templates and populating them with data. (Text extraction is now handled by `DocumentService`).
    -   `documentContextService.js`: Manages storage and retrieval of document context for chat sessions, utilizing Redis.
-   `middleware/`: Custom middleware functions.
    -   `errorMiddleware.js`: (Located in `server/middleware/errorMiddleware.js`) Contains global error handling middleware:
        -   `validationErrorHandler`: Handles errors from `express-validator`.
        -   `notFoundHandler`: Catches 404 errors for undefined routes.
        -   `globalErrorHandler`: Centralized error handler for consistent API error responses, managing different error types and formatting.
    -   `asyncHandler.js`: (Located in `server/utils/asyncHandler.js`) A wrapper for asynchronous route handlers to simplify error catching and passing to `next()`.
    -   (Other middleware like authentication, logging can be placed here).
-   `utils/`: Utility functions shared across the application.
    -   `errorHandler.js`: Provides utility functions for creating standardized error objects. (Its role in direct response handling is largely superseded by `globalErrorHandler` in `errorMiddleware.js`).
-   `tests/` (located in project root): Contains unit and integration tests.
    -   `unit/`: Unit tests for individual modules/functions.
    -   `integration/`: (Assumed for future integration tests for API endpoints).
    -   `fixtures/`: Test data and mock objects.
    -   `setup.js`: Setup file for the testing environment.

## 2. Environment Configuration

The application uses environment variables for configuration, managed via `.env` files at the project root.

-   A `.env.example` file serves as a template.
-   Environment-specific files like `.env.development`, `.env.test`, `.env.production` are used to load configurations based on the `NODE_ENV` variable.
-   Key configurations include database connection strings (MongoDB URI), API keys, server port (PORT), Redis URL (REDIS_URL), and JWT secrets (JWT_SECRET).
-   **MongoDB Connection**: The application features robust MongoDB connection management:
    -   Utilizes a singleton pattern to ensure a single, shared connection instance.
    -   Connection URI is selected based on the `NODE_ENV` (development, test, production).
    -   Implements connection pooling for efficient database interactions.
    -   Includes automatic retry logic for connection failures (except in the test environment).
    -   Ensures graceful disconnection from MongoDB when the server shuts down.

## 3. Core Features and Functionality

### 3.1. Chatbot

-   **Message Handling**: Processes user messages and interacts with AI models (currently mocked in development environments).
-   **Document Upload & Context**:
    -   Users can upload documents (PDF, DOCX, DOC, TXT) to provide context for chat sessions via the `/api/chat/upload-document` endpoint (note the updated endpoint name).
    -   Text extraction, file validation (size, MIME type), and file type information are handled by the `DocumentService` (`server/services/documentService.js`).
    -   Uploaded document context (including metadata like file size and type) is stored in Redis via `documentContextService.js`. The Redis connection is configured via `REDIS_URL`.
    -   The `chatController.js` includes logic for managing this context, and `documentContextService.js` might have its own cleanup mechanisms if implemented (e.g., TTL on Redis keys).
-   **Session Management**:
    -   `GET /api/chat/session/:sessionId`: Retrieves detailed session information, including the status of any associated document context.
    -   `POST /api/chat/clear-context`: Allows clearing the document context for a given session (identified by `sessionId` in the request body).
-   **Input Validation**: User inputs for chat messages (e.g., `sessionId`, `message` for the `/api/chat/message` endpoint) are validated using `express-validator` and `validationErrorHandler` middleware, as defined in `server/routes/chatRoutes.js`.
-   **Input Sanitization**: All incoming requests, including chat messages, are sanitized against NoSQL injection (using `express-mongo-sanitize`) and basic XSS attacks (using `xss-clean`). These middlewares are applied globally in `server.js`.

### 3.2. Document Generation

-   **Template-Based Generation**: Generates legal documents based on predefined templates and user-provided data via the `/api/documents/generate` endpoint.
-   **Input Validation**: Inputs for document generation (e.g., `templateType`, `data`) are validated using `express-validator`, as defined in `server/routes/documentRoutes.js`.
-   **Input Sanitization**: Similar to the chatbot, inputs are sanitized globally.

## 4. Database

-   **MongoDB**: The primary NoSQL database used for persistent storage.
-   **Mongoose**: ODM (Object Data Modeling) library used to interact with MongoDB, define schemas (in `server/models/`), and manage data.
-   Database connections are configured per environment via `server/config/db.js` and environment variables.

## 5. Caching

-   **Redis**: Used for caching, particularly for storing document context related to chat sessions.
-   The application connects to a Redis instance, typically a Dockerized one named `legalnomican-redis`, accessible via the `REDIS_URL`.
-   Successful Redis integration is confirmed by server startup logs and functionality in the chat context management.

## 6. Error Handling

-   The application employs a comprehensive, centralized error handling strategy:
    -   **`globalErrorHandler`** (in `server/middleware/errorMiddleware.js`): Acts as the final error handler for all API requests. It catches errors passed via `next(err)`, formats them into a consistent JSON response, and sets appropriate HTTP status codes. It handles instances of `AppError` (custom operational errors) and other system/unexpected errors.
    -   **`notFoundHandler`** (in `server/middleware/errorMiddleware.js`): Catches requests to undefined API routes and responds with a 404 error.
    -   **`validationErrorHandler`** (in `server/middleware/errorMiddleware.js`): Specifically handles validation errors generated by `express-validator`, formatting them consistently.
    -   **`asyncHandler`** (in `server/utils/asyncHandler.js`): A utility wrapper for asynchronous controller functions. It automatically catches promise rejections and passes them to `next()`, ensuring they are processed by the global error handlers.
    -   **`AppError` class** (in `server/utils/appError.js`): A custom error class used to create operational errors with specific status codes and messages, which `globalErrorHandler` can identify and handle gracefully.
    -   The old `server/utils/errorHandler.js` (with a `handleError` function) has been largely superseded by this more robust middleware-based system, though `AppError` from `appError.js` is now the primary utility for creating error objects.

## 7. Security

-   **Input Sanitization**:
    -   `express-mongo-sanitize`: Applied globally to protect against NoSQL injection attacks by stripping out prohibited characters (e.g., `$`, `.`) from request bodies, query parameters, and headers.
    -   `xss-clean`: Applied globally to provide basic protection against Cross-Site Scripting (XSS) attacks by sanitizing user input. (Note: `xss-clean` is deprecated; consider replacing it with a more actively maintained library like `dompurify` when appropriate).
-   **Input Validation**: `express-validator` is used to validate incoming data for specific API endpoints, ensuring data integrity and adherence to expected formats before processing by controllers.
-   **Vulnerability Management**: `npm audit fix` has been run to address known vulnerabilities in project dependencies, enhancing the overall security posture.

## 8. Code Quality and Maintainability

-   **Modularity**: The codebase is organized into distinct modules (controllers, services, routes, models, utils) with single responsibilities, improving clarity and ease of maintenance.
-   **DRY (Don't Repeat Yourself) Principle**: Efforts have been made to avoid code duplication. For example, document text extraction logic was consolidated into the `extractTextFromBuffer` function in `documentGenerationService.js`.
-   **File Size Management**: Large files have been refactored into smaller, more focused units (e.g., `server.js` was broken down, and `chatbot.css` was split into modular CSS files). This aligns with the preference for files under 200-300 lines.
-   **JSDoc Comments**: Added to functions and modules to improve code understanding and facilitate auto-generated documentation if needed.

## 9. Testing

-   The project includes a testing setup configured in `tests/setup.js`.
-   Unit tests are written for various components, such as `chatController.test.js` and `documentContextService.test.js`, located in the `tests/unit/` directory.
-   Test fixtures and mock data are stored in `tests/fixtures/` (e.g., `chatMessages.js`).
-   Tests are run in a specific test environment, often configured via `.env.test`.

## 10. Setup and Running the Backend

1.  **Prerequisites**:
    *   Node.js (check `.nvmrc` or `package.json` for version) and npm
    *   MongoDB instance (local, Docker, or cloud-based)
    *   Docker (if running Redis in a container)
2.  **Installation**:
    ```bash
    git clone <your_repository_url>
    cd LegalNomican
    npm install
    ```
3.  **Environment Configuration**:
    *   Copy `env.example` to a new file for your environment (e.g., `.env` or `.env.development`).
    *   Update the variables: `MONGO_URI`, `REDIS_URL`, `PORT`, `NODE_ENV`, `JWT_SECRET`, etc.
4.  **Start Redis (using Docker, if applicable)**:
    ```bash
    docker run -d --name legalnomican-redis -p 6379:6379 redis
    ```
    (This command was used as per memory `6c98e2c6-7c82-4217-b605-fcce81f61e88`.)
5.  **Run the server**:
    *   For development (with auto-reloading, if `nodemon` is configured in `package.json` scripts):
        ```bash
        npm run dev
        ```
    *   For production:
        ```bash
        npm start
        ```
    The server typically runs on the port specified by the `PORT` environment variable (e.g., 3001).

## 11. Key API Endpoints

(This section provides a high-level overview. Refer to `server/routes/` for detailed definitions, including all middleware and validation.)

### Chat API (Base Path: `/api/chat`)

-   **`POST /start`**: Initiates a new chat session.
    -   **Request Body**: (Potentially empty or can include initial user info/preferences if designed).
    -   **Response**: `{ "sessionId": "string", "message": "Welcome message" }`
-   **`POST /message`**: Sends a message within an existing chat session.
    -   **Validation**: `sessionId` (string, not empty), `message` (string, not empty).
    -   **Request Body**: `{ "sessionId": "string", "message": "string" }`
    -   **Response**: Chatbot's reply, e.g., `{ "reply": "string" }`.
-   **`POST /upload-document`**: Uploads a document to associate with the current chat session for context.
    -   **Request**: `multipart/form-data` with a file field (e.g., `document`) and a `sessionId` field.
    -   **Response**: Success message with document metadata, e.g., `{ "message": "Document uploaded successfully", "sessionId": "string", "fileName": "string", "fileSize": number, "fileType": "string", "wordCount": number }`.
-   **`POST /clear-context`**: Clears the document context associated with a session.
    -   **Request Body**: `{ "sessionId": "string" }`
    -   **Response**: Success message, e.g., `{ "message": "Document context cleared successfully", "sessionId": "string" }`.
-   **`GET /session/:sessionId`**: Retrieves information about a specific chat session.
    -   **URL Parameter**: `sessionId` (string).
    -   **Response**: Session details, including document context status, e.g., `{ "sessionId": "string", "conversation": [], "documentContext": { "status": "active/inactive/missing", "fileName": "string", "fileSize": number, "fileType": "string" } }`.

### Document Generation API (Base Path: `/api/documents`)

-   **`POST /generate`**: Requests the generation of a legal document.
    -   **Validation**: `templateType` (string, not empty), `data` (object, not empty).
    -   **Request Body**: `{ "templateType": "string", "data": {} }`
    -   **Response**: Generated document content or a link/ID to retrieve it.

---

This documentation should be reviewed and kept up-to-date as the backend evolves.