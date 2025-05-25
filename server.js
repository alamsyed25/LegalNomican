const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI);

// Demo submission schema
const DemoSubmissionSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    workEmail: { type: String, required: true },
    companyName: String,
    jobTitle: String,
    firmSize: String,
    useCase: String,
    phoneNumber: String,
    submittedAt: { type: Date, default: Date.now }
});

const DemoSubmission = mongoose.model('DemoSubmission', DemoSubmissionSchema);

// Submit demo form endpoint
app.post('/api/submit-demo-form', async (req, res) => {
    try {
        const submission = new DemoSubmission(req.body);
        await submission.save();
        
        // Generate unique demo URL
        const demoUrl = `/demo/${submission._id}`;
        
        res.json({ 
            success: true, 
            message: 'Form submitted successfully',
            demoUrl 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error submitting form' 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 