# Legal Nomicon

An AI-powered legal assistant platform for enterprise law firms with a modern web interface and robust backend.

## Features

- **AI-Powered Legal Research**: Advanced search and analysis of legal documents
- **Contract Review Assistant**: Automated contract analysis and risk assessment
- **Document Drafting**: AI-assisted document generation and templates
- **Interactive Chat Interface**: Natural language interaction with legal AI
- **Enterprise Security**: SOC 2 compliant with role-based access control
- **Multi-Environment Support**: Development, testing, and production environments

## Technologies Used

### Frontend
- HTML5/CSS3 with responsive design
- Vanilla JavaScript for interactivity
- Modern UI with dark theme and blue accents

### Backend
- Node.js with Express.js framework
- MongoDB for data storage
- RESTful API architecture
- Environment-specific configuration

### DevOps
- Environment-based configuration management
- Separation of concerns with modular code structure

## Project Structure

```
├── server/                 # Backend server code
│   ├── config/             # Configuration files
│   ├── controllers/        # Request handlers
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   └── utils/              # Utility functions
├── public/                 # Static assets
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore file
├── index.html             # Main landing page
├── chatbot.html           # Chat interface
├── server.js              # Server entry point
├── package.json           # Node.js dependencies
└── README.md              # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/LegalNomican.git
   cd LegalNomican
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Running the Application

#### Development Mode
```bash
npm run dev
```
This starts the server with nodemon for automatic reloading.

#### Production Mode
```bash
npm start
```

#### Testing Mode
```bash
npm test
```

### Accessing the Application

- **Landing Page**: http://localhost:3000
- **Chat Interface**: http://localhost:3000/chatbot.html
- **API Endpoint**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health

## Environment Configuration

The application supports multiple environments:

- **Development**: Local development with debugging enabled
- **Test**: For running automated tests
- **Production**: Optimized for deployment with enhanced security

Environment-specific settings are managed through the `.env` file and the configuration modules in the `server/config` directory.

## Git Workflow

- Before starting work: 
  - `git status` (check current state)
  - `git pull origin main` (get latest changes)
- Commit format: 
  - `feat:` for new features
  - `fix:` for bug fixes
  - `refactor:` for code restructuring
- Checking changes:
  - `git diff` (see unstaged changes)
  - `git log --oneline` (view recent commits)

## Contributing

Please follow the established coding patterns:

1. Keep files under 300 lines of code
2. Avoid code duplication
3. Write environment-aware code
4. Maintain clean separation of concerns
5. No mock data in production code

## License

MIT
