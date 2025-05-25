const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"]
       }
   }
}));

// Rate limiting
const limiter = rateLimit({
   windowMs: 15 * 60 * 1000, // 15 minutes
   max: 100, // limit each IP to 100 requests per windowMs
   message: {
       error: 'Too many requests from this IP, please try again later.'
   }
});
app.use('/api/', limiter);

// Compression and CORS
app.use(compression());
app.use(cors({
   origin: process.env.NODE_ENV === 'production' 
       ? ['https://legalnomicon.com', 'https://www.legalnomicon.com']
       : ['http://localhost:3000', 'http://127.0.0.1:3000'],
   credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const connectDB = async () => {
   try {
       const conn = await mongoose.connect(process.env.MONGODB_URI, {
           useNewUrlParser: true,
           useUnifiedTopology: true,
           maxPoolSize: 10,
           serverSelectionTimeoutMS: 5000,
           socketTimeoutMS: 45000,
       });
       console.log(`MongoDB Connected: ${conn.connection.host}`);
   } catch (error) {
       console.error('Database connection error:', error);
       setTimeout(connectDB, 5000);
   }
};

connectDB();

// Enhanced Schemas
const DemoSubmissionSchema = new mongoose.Schema({
   firstName: { type: String, required: true, trim: true },
   lastName: { type: String, required: true, trim: true },
   workEmail: { 
       type: String, 
       required: true, 
       lowercase: true,
       validate: {
           validator: function(v) {
               return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
           },
           message: 'Please enter a valid email address'
       }
   },
   companyName: { type: String, required: true, trim: true },
   jobTitle: { type: String, required: true },
   firmSize: { type: String, required: true },
   useCase: { type: String, required: true },
   phoneNumber: { type: String, trim: true },
   ipAddress: String,
   userAgent: String,
   referrer: String,
   submittedAt: { type: Date, default: Date.now },
   status: { type: String, enum: ['pending', 'contacted', 'demo_scheduled', 'closed'], default: 'pending' }
});

DemoSubmissionSchema.index({ workEmail: 1 });
DemoSubmissionSchema.index({ submittedAt: -1 });

const DemoSubmission = mongoose.model('DemoSubmission', DemoSubmissionSchema);

// Chat Conversation Schema
const ChatConversationSchema = new mongoose.Schema({
   sessionId: { type: String, required: true, unique: true },
   messages: [{
       sender: { type: String, enum: ['user', 'ai'], required: true },
       content: { type: String, required: true },
       timestamp: { type: Date, default: Date.now }
   }],
   createdAt: { type: Date, default: Date.now }
});

const ChatConversation = mongoose.model('ChatConversation', ChatConversationSchema);

// Helper functions
const generateSessionId = () => {
   return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const extractClientInfo = (req) => ({
   ipAddress: req.ip || req.connection.remoteAddress,
   userAgent: req.get('User-Agent'),
   referrer: req.get('Referer')
});

// Validation middleware
const validateDemoSubmission = (req, res, next) => {
   const { firstName, lastName, workEmail, companyName, jobTitle, firmSize, useCase } = req.body;
   
   const errors = [];
   
   if (!firstName || firstName.trim().length < 2) {
       errors.push('First name must be at least 2 characters');
   }
   if (!lastName || lastName.trim().length < 2) {
       errors.push('Last name must be at least 2 characters');
   }
   if (!workEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail)) {
       errors.push('Valid work email is required');
   }
   if (!companyName || companyName.trim().length < 2) {
       errors.push('Company name is required');
   }
   if (!jobTitle) {
       errors.push('Job title is required');
   }
   if (!firmSize) {
       errors.push('Firm size is required');
   }
   if (!useCase) {
       errors.push('Use case is required');
   }
   
   if (errors.length > 0) {
       return res.status(400).json({
           success: false,
           message: 'Validation failed',
           errors
       });
   }
   
   next();
};

// API Routes

// Enhanced demo form submission
app.post('/api/submit-demo-form', validateDemoSubmission, async (req, res) => {
   try {
       const clientInfo = extractClientInfo(req);
       
       // Check for duplicate submissions
       const recentSubmission = await DemoSubmission.findOne({
           workEmail: req.body.workEmail.toLowerCase(),
           submittedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
       });
       
       if (recentSubmission) {
           return res.status(429).json({
               success: false,
               message: 'A demo request with this email was already submitted recently.'
           });
       }
       
       const submission = new DemoSubmission({
           ...req.body,
           ...clientInfo
       });
       
       await submission.save();
       
       const demoUrl = `/demo?session=${submission._id}`;
       
       res.json({ 
           success: true, 
           message: 'Demo request submitted successfully',
           demoUrl,
           submissionId: submission._id
       });
       
   } catch (error) {
       console.error('Demo submission error:', error);
       res.status(500).json({ 
           success: false, 
           message: 'Error processing demo request. Please try again.' 
       });
   }
});

// Chat API endpoints
app.post('/api/chat/start', (req, res) => {
   const sessionId = generateSessionId();
   res.json({ 
       success: true, 
       sessionId,
       welcomeMessage: "Hello! I'm your Legal Nomicon assistant. How can I help you today?"
   });
});

app.post('/api/chat/message', async (req, res) => {
   try {
       const { sessionId, message } = req.body;
       
       if (!sessionId || !message) {
           return res.status(400).json({
               success: false,
               message: 'Session ID and message are required'
           });
       }
       
       // Find or create conversation
       let conversation = await ChatConversation.findOne({ sessionId });
       if (!conversation) {
           conversation = new ChatConversation({ sessionId });
       }
       
       // Add user message
       conversation.messages.push({
           sender: 'user',
           content: message
       });
       
       // Generate AI response
       const aiResponse = await generateAIResponse(message);
       
       // Add AI response
       conversation.messages.push({
           sender: 'ai',
           content: aiResponse
       });
       
       await conversation.save();
       
       res.json({
           success: true,
           response: aiResponse
       });
       
   } catch (error) {
       console.error('Chat message error:', error);
       res.status(500).json({
           success: false,
           message: 'Error processing message. Please try again.'
       });
   }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
   const dbState = mongoose.connection.readyState;
   const dbStatus = {
       0: 'disconnected',
       1: 'connected',
       2: 'connecting',
       3: 'disconnecting'
   };
   
   res.json({
       status: 'ok',
       timestamp: new Date().toISOString(),
       database: dbStatus[dbState],
       uptime: process.uptime()
   });
});

// Mock AI response generator
async function generateAIResponse(message) {
   await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
   
   const message_lower = message.toLowerCase();
   
   if (message_lower.includes('contract') || message_lower.includes('agreement')) {
       return `I can help you analyze contracts and agreements. Here are the key areas I typically review:

- **Risk Assessment**: Identifying potential liability and compliance issues
- **Clause Analysis**: Reviewing critical provisions like termination, indemnification, and dispute resolution
- **Compliance Checking**: Ensuring adherence to applicable laws and regulations

Would you like me to review a specific contract, or do you have questions about particular clauses?`;
   } else if (message_lower.includes('force majeure')) {
       return `Force majeure clauses have evolved significantly, especially post-COVID. Here's what you should know:

**Essential Elements:**
- Clear definition of qualifying events (natural disasters, pandemics, government actions)
- Specific notice requirements and timeframes
- Mitigation obligations for both parties

**Recent Legal Developments:**
Courts have become more restrictive in interpreting these clauses. The key test is whether the event actually prevents performance, not just makes it more difficult.

Would you like me to review your specific force majeure language?`;
   } else {
       return `I understand you're asking about "${message}". To provide the most helpful legal guidance, I'd like to know more about:

- The specific legal area or context
- Whether this relates to a contract, compliance issue, or legal research
- Any relevant jurisdiction or industry considerations

What specific aspect would you like to explore further?`;
   }
}

// Serve static files for all other routes
app.get('*', (req, res) => {
   res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});

module.exports = app;