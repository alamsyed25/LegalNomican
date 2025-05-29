const DemoSubmission = require('../models/DemoSubmission');
const { extractClientInfo } = require('../utils/helpers');

/**
 * Handle demo form submission
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const submitDemoForm = async (req, res) => {
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
};

module.exports = {
    submitDemoForm
};
