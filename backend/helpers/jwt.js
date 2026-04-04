const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('./jwt-secret');
const secret = getJwtSecret();
const { executeTransaction } = require('./sp-caller');

// Cache for token verification results
const tokenCache = new Map();
const TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// User status constants
const USER_STATUS = {
    DELETED: 'DELETED',
    NOT_FOUND: 'NOT_FOUND',
    INVALID_TOKEN: 'INVALID_TOKEN',
    ACTIVE: 'ACTIVE'
};

// Error response helper
const createErrorResponse = (status, message) => ({
    error: { message },
    status
});

function jwtMiddleware() {
    return async (req, res, next) => {
        try {
            // Extract token with early validation
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw createErrorResponse(401, 'Unauthorized: Missing or invalid token format');
            }

            const token = authHeader.split(' ')[1];
            
            // Check token cache first
            const cachedResult = tokenCache.get(token);
            // if (cachedResult && cachedResult.expiry > Date.now()) {
            //     req.userId = cachedResult.userId;
            //     req.isStudent = cachedResult.isStudent;
            //     return next();
            // }

            // Verify JWT token
            let decoded;
            try {
                decoded = jwt.verify(token, secret);
            } catch (jwtError) {
                if (jwtError.name === 'TokenExpiredError') {
                    throw createErrorResponse(401, 'Unauthorized: Token expired');
                }
                throw createErrorResponse(401, 'Unauthorized: Invalid token');
            }

            const userId = decoded.userId || 0;
            const isStudent = decoded.isStudent || 0;

            // Check user status with timeout
            try {
                const [userStatus] = await Promise.race([
                    executeTransaction('check_User', [userId, isStudent, token]),
                    new Promise((_, reject) =>  
                        
                        setTimeout(() => reject(new Error('Database timeout')), 5000)
                    )
                ]);

                console.log('userStatus: ', userStatus);
                if (!userStatus) {
                    throw createErrorResponse(500, 'Invalid response from database');
                }
                // tokenCache.set(token, {
                //     userId,
                //     isStudent,
                //     expiry: Date.now() + TOKEN_CACHE_DURATION
                // });
                // req.userId = userId;
                // req.isStudent = isStudent;
          
         
                // Handle user status
                
                switch (userStatus.status) {
                    case USER_STATUS.ACTIVE:
                        tokenCache.set(token, {
                            userId,
                            isStudent,
                            expiry: Date.now() + TOKEN_CACHE_DURATION
                        });
                        req.userId = userId;
                        req.isStudent = isStudent;
                        return next();
                 
                    case USER_STATUS.DELETED:
                        return res.status(401).json({
                            error: { message: 'Unauthorized: User account has been deleted' }
                        });
                 
                    case USER_STATUS.NOT_FOUND:
                        return res.status(401).json({
                            error: { message: 'Unauthorized: User not found' }
                        });
                 
                    case USER_STATUS.INVALID_TOKEN:
                        return res.status(401).json({
                            error: { message: 'Unauthorized: Invalid token' }
                        });
                 
                    default:
                        return res.status(500).json({
                            error: { message: 'Unknown user status received' }
                        });
                 }
            } catch (dbError) {
                console.log('dbError: ', dbError);
                console.error('Database Error:', dbError);
                if (dbError.message === 'Database timeout') {
                    throw createErrorResponse(503, 'Service temporarily unavailable');
                }
                throw createErrorResponse(500, 'Internal server error during user verification');
            }

        } catch (error) {
            // Clean up cache if there's an error
            if (req.headers.authorization) {
                const token = req.headers.authorization.split(' ')[1];
                tokenCache.delete(token);
            }

            // Log error with request context
            console.error('JWT Middleware Error:', {
                error: error.message,
                path: req.path,
                method: req.method,
                ip: req.ip,
                timestamp: new Date().toISOString()
            });

            // Send error response
            return res.status(error.status || 500).json({ 
                error: { message: error.message || 'Internal server error' }
            });
        }
    };
}

// Cleanup expired cache entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [token, data] of tokenCache.entries()) {
        if (data.expiry <= now) {
            tokenCache.delete(token);
        }
    }
}, 60000); // Clean up every minute

module.exports = jwtMiddleware;
