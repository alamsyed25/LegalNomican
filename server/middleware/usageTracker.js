/**
 * Usage tracking middleware to enforce plan limits
 */

/**
 * Track contract review usage (10 docs/month for starter plan)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const trackContractReview = async (req, res, next) => {
    try {
        // In development, just pass through
        if (process.env.NODE_ENV !== 'production') {
            return next();
        }
        
        // In production, implement actual usage tracking
        // This would check against user's plan and usage limits
        
        // Mock implementation - check if user has exceeded limit
        const userId = req.user?.id || 'anonymous';
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // This would be stored in database in real implementation
        const usage = await getMonthlyUsage(userId, currentYear, currentMonth);
        const userPlan = await getUserPlan(userId);
        
        const contractReviewLimit = getContractReviewLimit(userPlan);
        
        if (usage.contractReviews >= contractReviewLimit) {
            return res.status(429).json({
                success: false,
                message: `Monthly contract review limit (${contractReviewLimit}) exceeded. Please upgrade your plan.`,
                usage: {
                    current: usage.contractReviews,
                    limit: contractReviewLimit,
                    resetDate: getNextMonthDate()
                }
            });
        }
        
        // Increment usage count
        await incrementContractReviewUsage(userId, currentYear, currentMonth);
        
        next();
    } catch (error) {
        console.error('Usage tracking error:', error);
        next(); // Don't block on tracking errors
    }
};

/**
 * Track document generation usage (3 templates for starter plan)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const trackDocumentGeneration = async (req, res, next) => {
    try {
        // In development, just pass through
        if (process.env.NODE_ENV !== 'production') {
            return next();
        }
        
        const userId = req.user?.id || 'anonymous';
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const usage = await getMonthlyUsage(userId, currentYear, currentMonth);
        const userPlan = await getUserPlan(userId);
        
        const documentGenerationLimit = getDocumentGenerationLimit(userPlan);
        
        if (usage.documentsGenerated >= documentGenerationLimit) {
            return res.status(429).json({
                success: false,
                message: `Monthly document generation limit (${documentGenerationLimit}) exceeded. Please upgrade your plan.`,
                usage: {
                    current: usage.documentsGenerated,
                    limit: documentGenerationLimit,
                    resetDate: getNextMonthDate()
                }
            });
        }
        
        await incrementDocumentGenerationUsage(userId, currentYear, currentMonth);
        
        next();
    } catch (error) {
        console.error('Usage tracking error:', error);
        next();
    }
};

/**
 * Get monthly usage for user (mock implementation)
 * @param {string} userId - User ID
 * @param {number} year - Year
 * @param {number} month - Month
 * @returns {Promise<Object>} - Usage data
 */
const getMonthlyUsage = async (userId, year, month) => {
    // Mock implementation - in production this would query the database
    return {
        contractReviews: Math.floor(Math.random() * 5), // 0-4 for demo
        documentsGenerated: Math.floor(Math.random() * 2), // 0-1 for demo
        legalSearches: Math.floor(Math.random() * 10)
    };
};

/**
 * Get user's plan (mock implementation)
 * @param {string} userId - User ID
 * @returns {Promise<string>} - Plan type
 */
const getUserPlan = async (userId) => {
    // Mock implementation
    return 'starter'; // starter, professional, enterprise
};

/**
 * Get contract review limit based on plan
 * @param {string} plan - Plan type
 * @returns {number} - Contract review limit
 */
const getContractReviewLimit = (plan) => {
    const limits = {
        starter: 10,
        professional: 50,
        enterprise: -1 // unlimited
    };
    return limits[plan] || 10;
};

/**
 * Get document generation limit based on plan
 * @param {string} plan - Plan type
 * @returns {number} - Document generation limit
 */
const getDocumentGenerationLimit = (plan) => {
    const limits = {
        starter: 3,
        professional: 10,
        enterprise: -1 // unlimited
    };
    return limits[plan] || 3;
};

/**
 * Increment contract review usage (mock implementation)
 * @param {string} userId - User ID
 * @param {number} year - Year
 * @param {number} month - Month
 */
const incrementContractReviewUsage = async (userId, year, month) => {
    // Mock implementation - in production this would update the database
    console.log(`Incremented contract review usage for user ${userId}`);
};

/**
 * Increment document generation usage (mock implementation)
 * @param {string} userId - User ID
 * @param {number} year - Year
 * @param {number} month - Month
 */
const incrementDocumentGenerationUsage = async (userId, year, month) => {
    // Mock implementation
    console.log(`Incremented document generation usage for user ${userId}`);
};

/**
 * Get next month date for usage reset
 * @returns {Date} - Next month date
 */
const getNextMonthDate = () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    return nextMonth;
};

module.exports = {
    trackContractReview,
    trackDocumentGeneration
};