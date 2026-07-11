import 'dotenv/config';
import jwt from 'jsonwebtoken';

export const SECRET_KEY = process.env.JWT_SECRET || process.env.SECRET_KEY || 'flowfund_secret_key_change_me_in_prod';

// Dev-only print to verify keys
if (process.env.NODE_ENV !== 'production') {
    console.log('[Auth Audit] Loaded SECRET_KEY length:', SECRET_KEY.length);
    console.log('[Auth Audit] Is using default fallback key:', SECRET_KEY === 'flowfund_secret_key_change_me_in_prod');
}

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const headerKeys = Object.keys(req.headers);
    const authHeaderPresent = typeof authHeader !== 'undefined';
    
    // Check if Authorization header is missing
    if (!authHeaderPresent) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('[Auth Audit] Missing Authorization header. Available headers:', headerKeys);
        }
        return res.status(401).json({
            error: 'Unauthorized: Missing Authorization header',
            reason: 'no_authorization_header',
            headerKeys
        });
    }

    const parts = authHeader.split(' ');
    
    // Check if Bearer format is correct
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        if (process.env.NODE_ENV !== 'production') {
            console.error('[Auth Audit] Malformed Authorization header:', authHeader);
        }
        return res.status(401).json({
            error: 'Unauthorized: Malformed Authorization header. Expected Format: Bearer <token>',
            reason: 'malformed_authorization_header',
            headerValue: authHeader.substring(0, 15) + '...'
        });
    }

    const token = parts[1];

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            let reason = 'invalid_signature';
            if (err.name === 'TokenExpiredError') {
                reason = 'token_expired';
            } else if (err.name === 'JsonWebTokenError') {
                reason = 'malformed_token';
            }

            if (process.env.NODE_ENV !== 'production') {
                console.error('[Auth Audit] JWT verification failed:', err.message);
                console.error('[Auth Audit] Token:', token.substring(0, 10) + '...');
                console.error('[Auth Audit] Key used length:', SECRET_KEY.length);
            }

            return res.status(403).json({
                error: `Forbidden: JWT verification failed (${err.message})`,
                reason,
                details: err.message,
                tokenReceivedSnippet: token.substring(0, 10) + '...',
                tokenLength: token.length,
                secretKeyInfo: {
                    length: SECRET_KEY.length,
                    isDefault: SECRET_KEY === 'flowfund_secret_key_change_me_in_prod'
                }
            });
        }

        req.user = user;
        next();
    });
};
