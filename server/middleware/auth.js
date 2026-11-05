import 'dotenv/config';
import jwt from 'jsonwebtoken';

const resolveSecretKey = () => {
    const key = process.env.JWT_SECRET || process.env.SECRET_KEY;
    if (key) {
        return key;
    }
    if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: JWT_SECRET (or SECRET_KEY) environment variable must be set in production mode.');
    }
    return 'flowfund_development_secret_key_not_for_production';
};

export const SECRET_KEY = resolveSecretKey();

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({
            error: 'Unauthorized: Missing Authorization header',
            code: 'no_authorization_header'
        });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
        return res.status(401).json({
            error: 'Unauthorized: Malformed Authorization header. Expected Format: Bearer <token>',
            code: 'malformed_authorization_header'
        });
    }

    const token = parts[1];

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Unauthorized: Session has expired. Please log in again.',
                    code: 'token_expired'
                });
            }

            return res.status(401).json({
                error: 'Unauthorized: Invalid authentication token',
                code: 'invalid_token'
            });
        }

        req.user = user;
        next();
    });
};
