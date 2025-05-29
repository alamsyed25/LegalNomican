const mongoose = require('mongoose');

/**
 * Schema for demo form submissions
 */
const DemoSubmissionSchema = new mongoose.Schema({
    firstName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    lastName: { 
        type: String, 
        required: true, 
        trim: true 
    },
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
    companyName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    jobTitle: { 
        type: String, 
        required: true 
    },
    firmSize: { 
        type: String, 
        required: true 
    },
    useCase: { 
        type: String, 
        required: true 
    },
    phoneNumber: { 
        type: String, 
        trim: true 
    },
    ipAddress: String,
    userAgent: String,
    referrer: String,
    submittedAt: { 
        type: Date, 
        default: Date.now 
    },
    status: { 
        type: String, 
        enum: ['pending', 'contacted', 'demo_scheduled', 'closed'], 
        default: 'pending' 
    }
});

// Add indexes for performance
DemoSubmissionSchema.index({ workEmail: 1 });
DemoSubmissionSchema.index({ submittedAt: -1 });

const DemoSubmission = mongoose.model('DemoSubmission', DemoSubmissionSchema);

module.exports = DemoSubmission;
